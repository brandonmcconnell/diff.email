import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { user } from "../db/schema/auth";
import { protectedProcedure, router } from "../lib/trpc";

export const profileRouter = router({
	update: protectedProcedure
		.input(
			z.object({
				firstName: z.string().min(1).max(64),
				lastName: z.string().min(1).max(64),
				email: z.string().email(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await db
				.update(user)
				.set({
					firstName: input.firstName,
					lastName: input.lastName,
					name: `${input.firstName} ${input.lastName}`,
					email: input.email,
				})
				.where(eq(user.id, ctx.session.user.id));
			return { success: true };
		}),
	deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
		// Delete the currently authenticated user and cascade via FK constraints.
		await db.delete(user).where(eq(user.id, ctx.session.user.id));
		return { success: true };
	}),
});
