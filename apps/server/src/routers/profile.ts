import { eq, sql } from "drizzle-orm";
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
			// Guard: prevent changing email to one that already exists on a different account.
			// Use a case-insensitive lookup (`lower(email) = $email`) and explicitly skip the
			// current user row.
			const normalizedEmail = input.email.trim().toLowerCase();
			if (normalizedEmail.length > 0) {
				const [existing] = await db
					.select({ id: user.id })
					.from(user)
					// lower(email) = $1 AND id <> $2
					.where(
						sql`lower(${user.email}) = ${normalizedEmail} and ${user.id} <> ${ctx.session.user.id}`,
					)
					.limit(1);

				if (existing) {
					throw new Error("Email address already in use");
				}
			}
			await db
				.update(user)
				.set({
					firstName: input.firstName,
					lastName: input.lastName,
					name: `${input.firstName} ${input.lastName}`,
					email: normalizedEmail,
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
