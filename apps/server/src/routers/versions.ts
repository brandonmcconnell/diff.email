import { defaultHtmlTemplate, defaultJsxTemplate } from "@diff-email/shared";
import { desc, eq } from "drizzle-orm";
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
				entryPath: z.string().optional(),
				exportName: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { emailId, html, files, entryPath, exportName } = input;
			const [row] = await db
				.insert(version)
				.values({
					emailId,
					html: html ?? null,
					files: files ?? null,
					entryPath: entryPath ?? null,
					exportName: exportName ?? null,
				})
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
				.orderBy(desc(version.createdAt), desc(version.id))
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
					entryPath: "index.tsx",
					exportName: "default",
					createdAt: new Date(),
				} as const;
			}

			return {
				id: null,
				emailId: input.emailId,
				html: defaultHtmlTemplate(e.name),
				files: null,
				entryPath: null,
				exportName: null,
				createdAt: new Date(),
			} as const;
		}),

	list: protectedProcedure
		.input(z.object({ emailId: z.string().uuid() }))
		.query(async ({ input }) => {
			const rows = await db
				.select()
				.from(version)
				.where(eq(version.emailId, input.emailId))
				.orderBy(desc(version.createdAt), desc(version.id));

			return rows;
		}),
});
