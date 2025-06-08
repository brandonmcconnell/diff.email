import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { run, screenshot } from "../db/schema/core";
import { protectedProcedure, router } from "../lib/trpc";

export const runsRouter = router({
	create: protectedProcedure
		.input(
			z.object({
				emailId: z.string().uuid(),
				versionId: z.string().uuid(),
				// clients array & dark flag for future; accept but ignore for now
				clients: z.array(z.object({ client: z.string(), engine: z.string() })),
				dark: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { emailId, versionId } = input;
			const [row] = await db
				.insert(run)
				.values({ emailId, versionId })
				.returning();
			// TODO: enqueue BullMQ jobs here (Phase 3)
			return row;
		}),

	get: protectedProcedure
		.input(z.object({ runId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// fetch run and its screenshots
			const [runRow] = await db
				.select()
				.from(run)
				.where(eq(run.id, input.runId));
			const shots = await db
				.select()
				.from(screenshot)
				.where(eq(screenshot.runId, input.runId));
			return { ...runRow, screenshots: shots };
		}),

	list: protectedProcedure
		.input(z.object({ emailId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const rows = await db
				.select()
				.from(run)
				.where(eq(run.emailId, input.emailId))
				.orderBy(desc(run.createdAt));
			return rows;
		}),
});
