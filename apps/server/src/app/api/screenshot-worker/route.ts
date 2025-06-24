import "dotenv/config";

// TODO: This is a temporary fix to ensure Playwright looks for browsers inside node_modules/.local-browsers when deployed.
// Ensure Playwright looks for browsers inside node_modules/.local-browsers when deployed.
process.env.PLAYWRIGHT_BROWSERS_PATH = "0";

import { promises as fs } from "node:fs";
import logger from "@diff-email/logger";
import type { Client, ScreenshotJobData } from "@diff-email/shared";
import { put } from "@vercel/blob";
import { type Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import type { ElementHandle } from "playwright";
import { chromium, firefox, type Page, webkit } from "playwright";
// --- Shared imports from the server package ------------------------------
import { db } from "../../../db";
import { run, screenshot } from "../../../db/schema/core";
import { redis, screenshotsQueue } from "../../../lib/queue";
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
// Helper: get storage state for a client/engine combo.  MVP-only: downloads
// the blob file if it exists; otherwise throws (the headed cache script is
// responsible for ensuring files exist).  Automatic refresh will be added
// later.
async function getStorageStatePath(
	client: string,
	engine: string,
): Promise<string | undefined> {
	const envPrefix =
		process.env.VERCEL_ENV === "production"
			? "prod"
			: process.env.VERCEL_ENV === "preview"
				? "preview"
				: "dev";

	const key = `${envPrefix}/sessions/${client}-${engine}.json`;
	const url = `https://blob.vercel-storage.com/${sessionsBucket}/${key}`;

	try {
		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${sessionsToken}`,
			},
		});
		if (res.ok) {
			const buffer = Buffer.from(await res.arrayBuffer());
			const filePath = `/tmp/${client}-${engine}.json`;
			await fs.writeFile(filePath, buffer as NodeJS.ArrayBufferView);
			return filePath;
		}
	} catch (_) {
		/* swallow */
	}
	return undefined;
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

//--------------------------------------------------------------------------
// Helper: wait for an email to arrive in the mailbox and open it.
async function waitForEmail(
	page: Page,
	client: Client,
	subjectToken: string,
	timeoutMs = 90_000,
): Promise<void> {
	const start = Date.now();
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
		// Focus and search
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
			return; // success
		} catch (_e) {
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

	// Mark the run as running if it is still pending
	await db.update(run).set({ status: "running" }).where(eq(run.id, runId));

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

	try {
		// Choose browser type
		const browserType =
			engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium;

		// Attempt to load persistent context with storage state
		const storageStatePath = await getStorageStatePath(client, engine);
		if (storageStatePath)
			log.info({ storageStatePath }, "Loaded storage state");

		const context = await browserType.launchPersistentContext(
			`/tmp/${client}-${engine}`,
			{
				headless: true,
				...(storageStatePath ? { storageState: storageStatePath } : {}),
			},
		);
		const page = await context.newPage();

		if (!subjectToken) {
			throw new Error("Job is missing subjectToken; cannot locate email");
		}

		// Wait for the email to appear and open it once (light mode)
		await Promise.race([
			waitForEmail(page, client, subjectToken ?? ""),
			delayReject(90_000, "Timed out waiting for email > 90s"),
		]);

		// Helper to capture, upload, and insert one screenshot for given color scheme
		async function captureAndSave(isDark: boolean): Promise<void> {
			await page.emulateMedia({ colorScheme: isDark ? "dark" : "light" });

			log.info({ isDark }, "Capturing screenshot");

			const bodyHandle = await page.waitForSelector(
				selectors[client].messageBody,
				{ timeout: 10_000 },
			);
			if (!bodyHandle) throw new Error("Message body element not found");

			// Give remote images / fonts a chance to load fully
			try {
				await page.waitForLoadState("networkidle", { timeout: 5_000 });
			} catch (_) {
				/* ignore – we'll still capture after timeout */
			}
			await page.waitForTimeout(3_000); // additional settle buffer

			const buffer = await bodyHandle.screenshot({ type: "png" });

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

		// Capture light then dark
		await captureAndSave(false);
		await captureAndSave(true);

		await context.close();
	} catch (err) {
		log.error({ err }, "Processing failed");
		throw err; // let BullMQ mark job as failed
	}
}

const worker = new Worker<ScreenshotJobData>(
	screenshotsQueue.name,
	processJob,
	{
		connection: redis,
		concurrency: 3,
	},
);

logger.info(
	{ concurrency: 3 },
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

worker.on("active", (job: Job<ScreenshotJobData>) => {
	logger.info(
		{ jobId: job.id, client: job.data.client, engine: job.data.engine },
		"Job active",
	);
});

worker.on("completed", async (job: Job<ScreenshotJobData>) => {
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

worker.on("failed", (job: Job<ScreenshotJobData> | undefined, err: unknown) => {
	logger.error({ jobId: job?.id, err }, "Job failed");
	if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
		void db
			.update(run)
			.set({ status: "error" })
			.where(eq(run.id, job.data.runId));
	}
});

//-------------------------------------------------------------------------
// Vercel background function entry – returns a quick 200 while the
// BullMQ Worker keeps the Node event loop alive for up to 15 min.
export const maxDuration = 800;

export async function POST(): Promise<Response> {
	logger.info("Worker ping received");
	return new Response("Screenshot worker active", { status: 200 });
}
