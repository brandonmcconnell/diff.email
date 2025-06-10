import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { email, sentEmail, version } from "../db/schema/core";
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
			const res = await resend.emails.send({
				from: "Diff.email <noreply@diff.email>",
				to,
				subject,
				html: v.html,
			});

			// Resend returns { id, to, ... } but headers may contain Message-ID
			const resendId = res.id as string;
			let messageId: string | undefined;
			if (res?.headers && typeof res.headers === "object") {
				messageId = (res.headers as Record<string, string>)["message-id"];
			}

			// Store row
			await db.insert(sentEmail).values({
				versionId,
				resendId,
				messageId,
				to,
			});

			return { resendId, messageId };
		}),
});
