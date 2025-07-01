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
import type { ElementHandle, Page } from "playwright-core";
// --- Shared imports from the server package ------------------------------
import { db } from "../../../db";
import { run, screenshot } from "../../../db/schema/core";
import { connectBrowser } from "../../../lib/browserbase";
import { ensureLoggedIn } from "../../../lib/login";
import { redis, screenshotsQueue } from "../../../lib/queue";
import {
	clickShowImagesWithStagehand,
	loginWithStagehand,
	searchEmailWithStagehand,
	shutdownStagehand,
} from "../../../lib/stagehandHelpers";
import { withFallback } from "../../../lib/withFallback";
import { selectors } from "./selectors";

// -------------------------------------------------------------------------
// Environment helpers
const blobToken =
	process.env.SCREENSHOTS_PREVIEW_READ_WRITE_TOKEN ||
	process.env.SCREENSHOTS_READ_WRITE_TOKEN;

if (!blobToken) {
	throw new Error("No blob token found in env vars");
}

const sessionsBucket = process.env.SESSIONS_BUCKET ?? "diff-email-sessions";
const sessionsToken = process.env.SESSIONS_STATE_READ_WRITE_TOKEN;

if (!sessionsToken) {
	throw new Error("Missing SESSIONS_STATE_READ_WRITE_TOKEN env var");
}

//--------------------------------------------------------------------------
// Utility: click the geometrical center of an element via real mouse event.
async function mouseClickCenter(
	page: Page,
	handle: ElementHandle,
): Promise<void> {
	const box = await handle.boundingBox();
	if (!box) throw new Error("Could not obtain bounding box for element");
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

//--------------------------------------------------------------------------
// Utility: reject after N ms (used for Promise.race watchdog)
function delayReject(ms: number, msg: string): Promise<never> {
	return new Promise((_, reject) =>
		setTimeout(() => reject(new Error(msg)), ms),
	);
}

const defaultWaitForEmailTimeoutMs = 90_000;

//--------------------------------------------------------------------------
// Helper: wait for an email to arrive in the mailbox and open it.
async function waitForEmail(
	page: Page,
	client: Client,
	subjectToken: string,
	engine: Engine,
	timeoutMs = defaultWaitForEmailTimeoutMs,
): Promise<void> {
	const start = Date.now();
	const log = logger.child({ client, subjectToken, fn: "waitForEmail" });
	log.debug({ timeoutMs }, "Begin waiting for email");
	let attempts = 0;
	const { searchInput, searchResult, messageBody } = selectors[client];

	const baseUrls: Record<Client, string> = {
		gmail: "https://mail.google.com/mail/u/0/#inbox",
		outlook: "https://outlook.live.com/mail/0/",
		yahoo: "https://mail.yahoo.com/",
		aol: "https://mail.aol.com/",
		icloud: "https://www.icloud.com/mail",
	};

	await page.goto(baseUrls[client], { waitUntil: "domcontentloaded" });

	while (Date.now() - start < timeoutMs) {
		attempts++;
		log.debug({ attempts, elapsedMs: Date.now() - start }, "Search attempt");
		// Focus and search
		log.info(`[${client}:${engine}] [step] waiting for search-input`);
		await page.waitForSelector(searchInput, { timeout: 10_000 });
		if (client === "icloud") {
			// iCloud token field is a web-component; requires real mouse click then typing
			const handle = await page.$(searchInput);
			if (!handle) throw new Error("iCloud search field not found");
			await mouseClickCenter(page, handle);
			await page.keyboard.type(subjectToken, { delay: 50 });
		} else {
			// Ensure input is focused before filling, in case .fill alone doesn't trigger events
			await page.click(searchInput, { clickCount: 1 });
			await page.fill(searchInput, subjectToken);
		}
		await page.keyboard.press("Enter");

		try {
			await page.waitForSelector(searchResult, { timeout: 5_000 });
			const first = await page.$(searchResult);
			if (!first) throw new Error("Search result element vanished");

			if (client === "icloud") {
				// iCloud requires real mouse clicks
				await mouseClickCenter(page, first);
			} else {
				await first.click();
			}

			// Wait for the message body to render
			await page.waitForSelector(messageBody, { timeout: 10_000 });
			log.debug({ attempts }, "Email opened successfully");
			return; // success
		} catch (_e) {
			log.debug({ attempts }, "Email not found, will retry in 5s");
			// Email not yet found – wait and retry
			await page.waitForTimeout(5_000);
		}
	}

	throw new Error(
		`Email with token ${subjectToken} not found in ${client} within ${timeoutMs} ms`,
	);
}

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

	// Connect once and keep the session id for Stagehand attachment
	const { page, browser, cleanup, sessionId } = await connectBrowser(
		client,
		engine,
	);

	try {
		// 1) Login step ---------------------------------------------------------
		await withFallback({
			label: "login",
			log,
			primary: async () => {
				await ensureLoggedIn(page, client);
			},
			fallback: async () => {
				await loginWithStagehand(sessionId, client);
			},
		});

		// 2) Search/Open email step -------------------------------------------
		await withFallback({
			label: "locate-email",
			log,
			primary: async () => {
				await Promise.race([
					waitForEmail(page, client, subjectToken ?? "", engine),
					delayReject(
						defaultWaitForEmailTimeoutMs,
						"Timed out waiting for email > 90s",
					),
				]);
				log.info("Email located by deterministic selectors");
			},
			fallback: async () => {
				await searchEmailWithStagehand(sessionId, client, subjectToken ?? "");
			},
		});

		// 3) Optional Gmail "Show images" step --------------------------------
		if (client === "gmail") {
			await withFallback({
				label: "show-images",
				log,
				primary: async () => {
					const btn = await page.waitForSelector("button:text('Show images')", {
						timeout: 5_000,
					});
					await btn.click();
					log.info("Show images button clicked deterministically");
				},
				fallback: async () => {
					await clickShowImagesWithStagehand(sessionId);
				},
			});
		}

		// 4) Capture screenshots (deterministic, no fallback) ------------------
		async function capture(isDark: boolean): Promise<void> {
			await page.emulateMedia({ colorScheme: isDark ? "dark" : "light" });
			const bodyHandle = await page.waitForSelector(
				selectors[client].messageBody,
				{ timeout: 15_000 },
			);
			const buffer = await bodyHandle.screenshot({ type: "png" });
			const filename = `screenshots/${job.id}-${isDark ? "dark" : "light"}.png`;
			const { url } = await put(filename, buffer, {
				access: "public",
				token: blobToken,
			});
			await db
				.insert(screenshot)
				.values({ runId, client, engine, darkMode: isDark, url });
		}

		await capture(false);
		await capture(true);
	} finally {
		await cleanup().catch(() => {
			/* ignore */
		});
		await shutdownStagehand(sessionId).catch(() => {});
	}

	log.info(`[${client}:${engine}] job complete`);
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

	w.on("failed", (job: Job<ScreenshotJobData> | undefined, err: unknown) => {
		logger.error({ jobId: job?.id, err }, "Job failed");
		if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
			void db
				.update(run)
				.set({ status: "error" })
				.where(eq(run.id, job.data.runId));
		}
	});

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
