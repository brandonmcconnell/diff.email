import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { version } from "../db/schema/core";
import { protectedProcedure, router } from "../lib/trpc";

export const versionsRouter = router({
	save: protectedProcedure
		.input(
			z.object({
				emailId: z.string().uuid(),
				html: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { emailId, html } = input;
			const [row] = await db
				.insert(version)
				.values({ emailId, html })
				.returning();
			return row.id;
		}),
});
