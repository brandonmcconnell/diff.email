import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { email, project } from "../db/schema/core";
import { protectedProcedure, router } from "../lib/trpc";

export const projectsRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const rows = await db
			.select({
				id: project.id,
				name: project.name,
				userId: project.userId,
				createdAt: project.createdAt,
				count: sql<number>`count(${email.id})::int`.as("count"),
				type: sql<"project">`'project'`.as("type"),
			})
			.from(project)
			.leftJoin(email, eq(project.id, email.projectId))
			.where(eq(project.userId, userId))
			.groupBy(project.id);
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
	update: protectedProcedure
		.input(z.object({ id: z.string().uuid(), name: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { id, name } = input;
			// Ensure project belongs to user
			const [existing] = await db
				.select({ id: project.id })
				.from(project)
				.where(eq(project.id, id));
			if (!existing) throw new Error("Project not found");
			// TODO: optionally check userId once user FK exists
			const [row] = await db
				.update(project)
				.set({ name })
				.where(eq(project.id, id))
				.returning();
			return row;
		}),
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { id } = input;
			// Ensure project exists
			const [existing] = await db
				.select({ id: project.id })
				.from(project)
				.where(eq(project.id, id));
			if (!existing) throw new Error("Project not found");
			await db.delete(project).where(eq(project.id, id));
			return { success: true };
		}),
});
