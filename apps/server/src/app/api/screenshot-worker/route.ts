import "dotenv/config";

// TODO: This is a temporary fix to ensure Playwright looks for browsers inside node_modules/.local-browsers when deployed.
// Ensure Playwright looks for browsers inside node_modules/.local-browsers when deployed.
process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "1";

import logger from "@diff-email/logger";
import type { Client, Engine, ScreenshotJobData } from "@diff-email/shared";
import { put } from "@vercel/blob";
import { type Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
// Playwright types no longer directly imported – Stagehand encapsulates them
// --- Shared imports from the server package ------------------------------
import { db } from "../../../db";
import { run, screenshot } from "../../../db/schema/core";
import { redis, screenshotsQueue } from "../../../lib/queue";
import { StagehandClient } from "../../../lib/stagehandClient";

// imports removed: inboxUrls, selectors – no longer needed

// -------------------------------------------------------------------------
// Environment helpers
const blobToken =
	process.env.SCREENSHOTS_PREVIEW_READ_WRITE_TOKEN ||
	process.env.SCREENSHOTS_READ_WRITE_TOKEN;

if (!blobToken) {
	throw new Error("No blob token found in env vars");
}

//--------------------------------------------------------------------------
// Helper step functions implementing granular deterministic logic with
// Stagehand fallbacks. Each function will attempt the deterministic
// strategy first and, if that fails, fall back to Stagehand for a natural
// language approach before returning control to deterministic selectors for
// the following steps.
//--------------------------------------------------------------------------
async function processJob(job: Job<ScreenshotJobData>): Promise<void> {
	const { runId, client, engine, subjectToken } = job.data;

	const log = logger.child({ jobId: job.id, runId, client, engine });
	log.info("Job received");
	log.debug({ jobData: job.data }, "Raw job data");

	// Mark the run as running if it is still pending
	await db.update(run).set({ status: "running" }).where(eq(run.id, runId));
	log.debug("Run status set to 'running'");

	// Verify the run row exists, retrying a few times to account for possible replica lag
	let runRowExists: { id: string } | undefined;
	for (let attempt = 0; attempt < 5; attempt++) {
		[runRowExists] = await db
			.select({ id: run.id })
			.from(run)
			.where(eq(run.id, runId));

		if (runRowExists) break;

		// Wait with exponential back-off: 100 ms, 200 ms, 400 ms, …
		await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
	}

	if (!runRowExists) {
		log.error("Run row not found after retries; aborting job");
		throw new Error("Run row missing in database (after retries)");
	}
	log.debug("Verified run row exists in database");

	const jobStart = Date.now();
	let sh!: StagehandClient;
	try {
		sh = new StagehandClient(client, engine);
		await sh.init();
		log.info(
			{ event: "bb.session", sessionId: sh!.sessionId, client, engine },
			"bb.session",
		);

		// optional login (skips if already logged in)
		await sh.login();

		if (!subjectToken) {
			throw new Error("Job is missing subjectToken; cannot locate email");
		}

		await sh.openEmail(subjectToken);

		if (client === "gmail") {
			await sh.showRemoteImagesIfNeeded();
		}

		// Helper: capture & upload
		async function captureAndSave(isDark: boolean): Promise<void> {
			const buffer = await sh.screenshotBody(isDark);
			const filename = `screenshots/${job.id}-${isDark ? "dark" : "light"}.png`;
			const { url } = await put(filename, buffer, {
				access: "public",
				token: blobToken,
			});

			await db.insert(screenshot).values({
				runId,
				client,
				engine,
				darkMode: isDark,
				url,
			});
			log.info({ isDark, url }, "Screenshot saved");
		}

		await captureAndSave(false);
		await captureAndSave(true);

		log.info(
			{
				event: "job.done",
				duration: Date.now() - jobStart,
				success: true,
				sessionId: sh!.sessionId,
				client,
				engine,
			},
			"job.done",
		);
	} catch (err) {
		log.error(
			{
				event: "job.done",
				err,
				success: false,
				sessionId: sh?.sessionId,
				client,
				engine,
			},
			"job.done",
		);
		throw err;
	} finally {
		if (sh) {
			try {
				await sh.close();
			} catch (_) {
				/* swallow */
			}
		}
	}
}

//-------------------------------------------------------------------------
// Ensure we create at most ONE BullMQ Worker per Vercel container.
// In dev (Next.js hot-reload) or when the route file is re-evaluated we
// might run this module multiple times, so we cache the instance on
// `globalThis`.
//
// Using a symbol avoids accidental collisions with other globals.
const WORKER_KEY = Symbol.for("diff-email.screenshot-worker");

type GlobalWithWorker = typeof globalThis & {
	[WORKER_KEY]?: Worker<ScreenshotJobData>;
};

const g = globalThis as GlobalWithWorker;

// -------------------------------------------------------------------------
// Capture *any* unhandled errors so that they are logged and do not silently
// crash the Vercel background function without context. This also prevents
// the process from exiting early – BullMQ will simply mark the job as
// stalled and retry.
process.on("unhandledRejection", (reason) => {
	logger.error({ reason }, "Unhandled promise rejection (global)");
});

process.on("uncaughtException", (err) => {
	logger.error({ err }, "Uncaught exception (global)");
});

if (g[WORKER_KEY] == null) {
	const w = new Worker<ScreenshotJobData>(screenshotsQueue.name, processJob, {
		connection: redis,
		concurrency: 15,
		stalledInterval: 60_000,
		maxStalledCount: 1,
		lockDuration: 300_000,
	});

	// Attach listeners only on the first creation.
	logger.info(
		{ concurrency: 15 },
		"Screenshot worker started and waiting for jobs",
	);

	logger.info({
		env: process.env.VERCEL_ENV ?? "dev",
		redis: `${process.env.UPSTASH_REDIS_TLS_URL?.slice(0, 32)}…`,
		blobBucket: process.env.SESSIONS_BUCKET ?? "diff-email-sessions",
		blobToken: `${(
			process.env.SCREENSHOTS_READ_WRITE_TOKEN ||
				process.env.SCREENSHOTS_PREVIEW_READ_WRITE_TOKEN
		)?.slice(0, 10)}…`,
	});

	w.on("active", (job: Job<ScreenshotJobData>) => {
		logger.info(
			{ jobId: job.id, client: job.data.client, engine: job.data.engine },
			"Job active",
		);
	});

	w.on("completed", async (job: Job<ScreenshotJobData>) => {
		// Count how many screenshots we have saved so far for this run
		const [runRow] = await db
			.select({ expectedShots: run.expectedShots })
			.from(run)
			.where(eq(run.id, job.data.runId));

		const expected = runRow?.expectedShots ?? 15;

		const rows = await db
			.select({ id: screenshot.id })
			.from(screenshot)
			.where(eq(screenshot.runId, job.data.runId));

		if (rows.length >= expected) {
			await db
				.update(run)
				.set({ status: "done" })
				.where(eq(run.id, job.data.runId));
		}
	});

	w.on(
		"failed",
		async (job: Job<ScreenshotJobData> | undefined, err: unknown) => {
			logger.error({ jobId: job?.id, err }, "Job failed");
			if (!job) return;
			const { runId, client: jClient, engine: jEngine } = job.data;
			// Remove the failed combo from the run.combos array so UI stops showing it as processing.
			try {
				const [row] = await db
					.select({ combos: run.combos })
					.from(run)
					.where(eq(run.id, runId));
				if (row?.combos) {
					const remaining = (
						row.combos as { client: Client; engine: Engine }[]
					).filter((c) => !(c.client === jClient && c.engine === jEngine));
					const updateData: Partial<typeof run.$inferSelect> = {
						combos: remaining,
					};
					if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
						updateData.status = "error" as const;
					}

					await db.update(run).set(updateData).where(eq(run.id, runId));
				}
			} catch (updateErr) {
				logger.error(
					{ err: updateErr },
					"Failed to update run.combos after job failure",
				);
			}
		},
	);

	// Capture internal BullMQ / Redis errors
	w.on("error", (err: unknown) => {
		logger.error({ err }, "BullMQ worker error event");
	});

	g[WORKER_KEY] = w; // cache on globalThis
}

//-------------------------------------------------------------------------
// Vercel background function entry – returns a quick 200 while the
// BullMQ Worker keeps the Node event loop alive for up to 15 min.
export const maxDuration = 800;

// Vercel Cron jobs issue GET requests; accept them too.
export async function GET(): Promise<Response> {
	logger.info("Worker ping received (GET)");
	await new Promise((resolve) => setTimeout(resolve, 50000));
	return new Response("Screenshot worker active", { status: 200 });
}
