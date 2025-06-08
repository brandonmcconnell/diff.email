import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { email } from "../db/schema/core";
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
});
