import { and, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "../db";
import { run, screenshot, version } from "../db/schema/core";
import { screenshotsQueue } from "../lib/queue";
import { protectedProcedure, router } from "../lib/trpc";

export const runsRouter = router({
	create: protectedProcedure
		.input(
			z.object({
				emailId: z.string().uuid(),
				versionId: z.string().uuid(),
				// clients array & dark flag for future; accept but ignore for now
				clients: z.array(
					z.object({
						client: z.enum(["gmail", "outlook", "yahoo", "aol", "icloud"]),
						engine: z.enum(["chromium", "firefox", "webkit"]),
					}),
				),
				dark: z.boolean(),
				subjectToken: z.string().optional(),
				messageId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { emailId, versionId, clients, dark, subjectToken, messageId } =
				input;

			// Deduplicate against existing screenshots for the *same version*.
			// Fetch existing client/engine pairs already captured for this version.
			const existingRows = await db
				.select({ client: screenshot.client, engine: screenshot.engine })
				.from(screenshot)
				.innerJoin(run, eq(screenshot.runId, run.id))
				.where(eq(run.versionId, versionId));

			const existingSet = new Set<string>();
			for (const r of existingRows) {
				if (r.client && r.engine) {
					existingSet.add(`${r.client as string}|${r.engine as string}`);
				}
			}

			const uniqueClients = clients.filter(
				(c) => !existingSet.has(`${c.client}|${c.engine}`),
			);

			if (uniqueClients.length === 0) {
				throw new Error("Requested screenshots have already been generated");
			}

			// fetch HTML for the version to embed in job data
			const [versionRow] = await db
				.select()
				.from(version)
				.where(eq(version.id, versionId));
			if (!versionRow) {
				throw new Error("Version not found");
			}
			const expectedShots = uniqueClients.length;
			const monthlyQuota = 100; // TODO: move to env/config/db, will be user/plan/org/team-specific
			const startOfMonth = new Date();
			startOfMonth.setUTCDate(1);
			startOfMonth.setUTCHours(0, 0, 0, 0);
			// Count existing screenshots for user this month
			if (!ctx.session?.user?.id) throw new Error("Not authenticated");
			const userId = ctx.session.user.id;
			const result = await db.execute<{
				count: number;
			}>(
				sql /*sql*/`SELECT count(s.id)::int FROM screenshots s
					JOIN runs r ON s.run_id = r.id
					JOIN emails e ON r.email_id = e.id
					JOIN projects p ON e.project_id = p.id
					WHERE p.user_id = ${userId} AND s.created_at >= ${startOfMonth}`,
			);
			const used = Number(result.rows?.[0]?.count ?? 0);
			const willUse = clients.length;
			if (used + willUse > monthlyQuota) {
				throw new Error("Monthly screenshot quota exceeded");
			}
			const [row] = await db
				.insert(run)
				.values({ emailId, versionId, expectedShots })
				.returning();

			if (!row) {
				throw new Error("Failed to insert run row");
			}
			// Enqueue a job per client/engine pair
			await Promise.all(
				uniqueClients.map((c) =>
					screenshotsQueue.add(
						"screenshot",
						{
							runId: row.id,
							html: versionRow.html,
							client: c.client,
							engine: c.engine,
							dark,
							subjectToken,
							messageId,
						},
						{
							attempts: 3,
							backoff: {
								type: "exponential",
								delay: 30_000, // 30 s initial delay
							},
							removeOnComplete: true,
							removeOnFail: false,
						},
					),
				),
			);
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
