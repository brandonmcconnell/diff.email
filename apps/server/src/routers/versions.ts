import { defaultHtmlTemplate, defaultJsxTemplate } from "@diff-email/shared";
import { eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "../db";
import { version } from "../db/schema/core";
import { email } from "../db/schema/core";
import { protectedProcedure, router } from "../lib/trpc";

export const versionsRouter = router({
	save: protectedProcedure
		.input(
			z.object({
				emailId: z.string().uuid(),
				html: z.string().optional(),
				files: z.record(z.string(), z.string()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { emailId, html, files } = input;
			const [row] = await db
				.insert(version)
				.values({ emailId, html: html ?? null, files: files ?? null })
				.returning();
			return row.id;
		}),

	getLatest: protectedProcedure
		.input(z.object({ emailId: z.string().uuid() }))
		.query(async ({ input }) => {
			const [row] = await db
				.select()
				.from(version)
				.where(eq(version.emailId, input.emailId))
				.orderBy(({ createdAt }) => sql`${createdAt} DESC`)
				.limit(1);

			if (row) return row;

			// No versions yet – return virtual V0 based on email language
			const [e] = await db
				.select({ language: email.language, name: email.name })
				.from(email)
				.where(eq(email.id, input.emailId));

			if (!e) return null;

			if (e.language === "jsx") {
				return {
					id: null,
					emailId: input.emailId,
					html: null,
					files: { "index.tsx": defaultJsxTemplate },
					createdAt: new Date(),
				} as const;
			}

			return {
				id: null,
				emailId: input.emailId,
				html: defaultHtmlTemplate(e.name),
				files: null,
				createdAt: new Date(),
			} as const;
		}),
});
