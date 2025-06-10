import { eq } from "drizzle-orm";
import type { CreateEmailResponse } from "resend";
import { z } from "zod";
import { db } from "../db";
import { email, run, sentEmail, version } from "../db/schema/core";
import { screenshotsQueue } from "../lib/queue";
import { protectedProcedure, router } from "../lib/trpc";

export const emailsRouter = router({
	list: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const rows = await db
				.select()
				.from(email)
				.where(eq(email.projectId, input.projectId));
			return rows;
		}),
	create: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				title: z.string().min(1),
				html: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { projectId, title, html } = input;
			const [row] = await db
				.insert(email)
				.values({ projectId, title })
				.returning();
			// Optionally create initial version if html provided (Phase 3)
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

			// Send via Resend
			const { resend } = await import("../lib/resend");
			const res: CreateEmailResponse = await resend.emails.send({
				from: "Diff.email <noreply@diff.email>",
				to,
				subject,
				html: v.html,
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

			// Send email via Resend (v4)
			const { resend } = await import("../lib/resend");
			const res: CreateEmailResponse = await resend.emails.send({
				from: "Diff.email <noreply@diff.email>",
				to,
				subject,
				html: v.html,
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

			// Insert run row
			const [runRow] = await db
				.insert(run)
				.values({ emailId, versionId })
				.returning();

			// Enqueue screenshots (messageId not used currently)
			await Promise.all(
				clients.map((c) =>
					screenshotsQueue.add("screenshot", {
						runId: runRow.id,
						html: v.html,
						client: c.client,
						engine: c.engine,
						dark,
					}),
				),
			);

			return { runId: runRow.id, resendId };
		}),
});
