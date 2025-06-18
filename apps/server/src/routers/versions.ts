import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { version } from "../db/schema/core";
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
			return row;
		}),
});
