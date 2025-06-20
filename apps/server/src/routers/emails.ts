import { randomUUID } from "node:crypto";
import { defaultHtmlTemplate, defaultJsxTemplate } from "@diff-email/shared";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { CreateEmailResponse } from "resend";
import { z } from "zod/v4";
import { db } from "../db";
import { user } from "../db/schema/auth";
import { email, project, run, sentEmail, version } from "../db/schema/core";
import { screenshotsQueue } from "../lib/queue";
import { resend } from "../lib/resend";
import { protectedProcedure, router } from "../lib/trpc";

export const emailsRouter = router({
	list: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const rows = await db
				.select({
					id: email.id,
					projectId: email.projectId,
					name: email.name,
					userId: project.userId,
					createdAt: email.createdAt,
					authorName: user.name,
					authorEmail: user.email,
					count: sql<number>`count(${version.id})::int`.as("count"),
					type: sql<"email">`'email'`.as("type"),
					language: email.language,
				})
				.from(email)
				.leftJoin(version, eq(email.id, version.emailId))
				.leftJoin(project, eq(email.projectId, project.id))
				.leftJoin(user, eq(project.userId, user.id))
				.where(eq(email.projectId, input.projectId))
				.groupBy(
					email.id,
					project.userId,
					user.name,
					user.email,
					email.language,
				);
			return rows;
		}),
	create: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				name: z.string().min(1),
				language: z.enum(["html", "jsx"]).default("html"),
				html: z.string().optional(),
				files: z.record(z.string(), z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { projectId, name, language, html, files: inputFiles } = input;
			const [row] = await db
				.insert(email)
				.values({ projectId, name, language })
				.returning();

			if (language === "jsx") {
				const content = inputFiles ?? { "index.tsx": defaultJsxTemplate };
				await db.insert(version).values({ emailId: row.id, files: content });
			} else {
				// HTML email - seed initial version (blank or provided)
				const content =
					html && html.trim().length > 0 ? html : defaultHtmlTemplate(name);
				await db.insert(version).values({ emailId: row.id, html: content });
			}
			return row;
		}),
	/**
	 * Send a test email using a specific version HTML.
	 */
	sendTest: protectedProcedure
		.input(
			z.object({
				versionId: z.string().uuid(),
				to: z.string().email(),
				subject: z.string().min(1).default("Test email from diff.email"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { versionId, to, subject } = input;

			// Fetch HTML for the version
			const [v] = await db
				.select({ html: version.html })
				.from(version)
				.where(eq(version.id, versionId));
			if (!v) {
				throw new Error("Version not found");
			}

			const htmlContent = v.html;
			if (!htmlContent) {
				throw new Error("Version does not contain HTML content");
			}
			// Send via Resend
			const res: CreateEmailResponse = await resend.emails.send({
				from: "Diff.email <noreply@diff.email>",
				to,
				subject,
				html: htmlContent,
			});

			if (!res.data) {
				throw new Error(
					res.error?.message ?? "Failed to send email via Resend",
				);
			}

			const resendId = res.data.id;

			await db.insert(sentEmail).values({
				versionId,
				resendId,
				to,
			});

			return { resendId };
		}),
	/**
	 * Send test email and enqueue screenshot run.
	 */
	sendTestAndRun: protectedProcedure
		.input(
			z.object({
				emailId: z.string().uuid(),
				versionId: z.string().uuid(),
				to: z.string().email(),
				subject: z.string().min(1).default("Test email from diff.email"),
				clients: z
					.array(
						z.object({
							client: z.enum(["gmail", "outlook", "yahoo", "aol", "icloud"]),
							engine: z.enum(["chromium", "firefox", "webkit"]),
						}),
					)
					.default([{ client: "gmail", engine: "chromium" }]),
				dark: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { emailId, versionId, to, subject, clients, dark } = input;

			// Fetch HTML for the version
			const [v] = await db
				.select({ html: version.html })
				.from(version)
				.where(eq(version.id, versionId));
			if (!v) throw new Error("Version not found");

			// Generate a short unique token to later find the email in webmail UIs.
			const subjectToken = randomUUID().slice(0, 8);
			const subjectWithToken = `${subject} [${subjectToken}]`;

			const htmlContent = v.html;
			if (!htmlContent) throw new Error("Version does not contain HTML");
			// Send email via Resend with the token appended to subject
			const res: CreateEmailResponse = await resend.emails.send({
				from: "Diff.email <noreply@diff.email>",
				to,
				subject: subjectWithToken,
				html: htmlContent,
			});

			if (!res.data) {
				throw new Error(
					res.error?.message ?? "Failed to send email via Resend",
				);
			}

			const resendId = res.data.id;

			await db.insert(sentEmail).values({
				versionId,
				resendId,
				to,
			});

			// Insert run row with expected shot count
			const expectedShots = clients.length;
			const [runRow] = await db
				.insert(run)
				.values({ emailId, versionId, expectedShots })
				.returning();

			if (!runRow) {
				throw new Error("Failed to insert run row");
			}

			// Enqueue screenshots with the subjectToken so the worker can search the inbox.
			await Promise.all(
				clients.map((c) =>
					screenshotsQueue.add(
						"screenshot",
						{
							runId: runRow.id,
							html: htmlContent,
							client: c.client,
							engine: c.engine,
							dark,
							subjectToken,
						},
						{
							attempts: 3,
							backoff: { type: "exponential", delay: 30000 },
							removeOnComplete: true,
							removeOnFail: false,
						},
					),
				),
			);

			return { runId: runRow.id, resendId };
		}),
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1),
				language: z.enum(["html", "jsx"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, name, language } = input;
			const [existing] = await db
				.select({ id: email.id })
				.from(email)
				.where(eq(email.id, id));
			if (!existing) throw new Error("Email not found");
			const [row] = await db
				.update(email)
				.set({ name, ...(language ? { language } : {}) })
				.where(eq(email.id, id))
				.returning();
			return row;
		}),
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;
			const [existing] = await db
				.select({ id: email.id })
				.from(email)
				.where(eq(email.id, id));
			if (!existing) throw new Error("Email not found");
			await db.delete(email).where(eq(email.id, id));
			return { success: true };
		}),
});
