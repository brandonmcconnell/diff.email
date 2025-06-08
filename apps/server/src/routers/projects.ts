import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { project } from "../db/schema/core";
import { protectedProcedure, router } from "../lib/trpc";

export const projectsRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const rows = await db
			.select()
			.from(project)
			.where(eq(project.userId, userId));
		return rows;
	}),
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const [row] = await db
				.insert(project)
				.values({ name: input.name, userId })
				.returning();
			return row;
		}),
});
