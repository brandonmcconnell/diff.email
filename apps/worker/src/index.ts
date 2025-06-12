import "dotenv/config";

// TODO: This is a temporary fix to ensure Playwright looks for browsers inside node_modules/.local-browsers when deployed.
// Ensure Playwright looks for browsers inside node_modules/.local-browsers when deployed.
process.env.PLAYWRIGHT_BROWSERS_PATH = "0";

import { promises as fs } from "node:fs";
import logger from "@diff-email/logger";
import { put } from "@vercel/blob";
import { type Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { type Page, chromium, firefox, webkit } from "playwright";

import type { ScreenshotJobData } from "@diff-email/shared";
// --- Shared imports from the server package ------------------------------
import { db } from "@server/db";
import { run, screenshot } from "@server/db/schema/core";
import { redis, screenshotsQueue } from "@server/lib/queue";

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
async function processJob(job: Job<ScreenshotJobData>): Promise<void> {
	const { runId, html, client, engine, dark, subjectToken, messageId } =
		job.data;

	const log = logger.child({ jobId: job.id, runId, client, engine });
	log.info("Job received");

	// Mark the run as running if it is still pending
	await db.update(run).set({ status: "running" }).where(eq(run.id, runId));

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

		// Dark mode emulation
		await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });

		let captured = false;
		if (client === "gmail" && subjectToken) {
			try {
				log.info({ subjectToken }, "Opening Gmail to locate email");

				await openGmailMessage(page, subjectToken, messageId);
				captured = true;
			} catch (err) {
				log.warn({ err }, "Gmail flow failed, falling back to setContent");
			}
		}

		if (!captured) {
			log.info("Rendering HTML via setContent fallback");
			await page.setContent(html, { waitUntil: "load" });
		}

		const buffer = await page.screenshot();
		log.info({ bytes: buffer.length }, "Screenshot captured");

		await context.close();

		// Upload screenshot
		const { url } = await put(`screenshots/${job.id}.png`, buffer, {
			access: "public",
			token: blobToken,
		});
		log.info({ url }, "Uploaded screenshot");

		// Insert DB row
		await db.insert(screenshot).values({
			runId,
			client,
			engine,
			darkMode: dark,
			url,
		});
		log.info("DB row inserted");
	} catch (err) {
		log.error({ err }, "Processing failed");
		throw err; // let BullMQ mark job as failed
	}
}

// ------------------------------------------------------------------------
// Helper: open Gmail and locate the message containing the unique token.
async function openGmailMessage(
	page: Page,
	token: string,
	messageId?: string,
): Promise<void> {
	// Navigate to Gmail search URL. We rely on persistent login state.
	const q = messageId ? `rfc822msgid:${messageId}` : token;
	await page.goto(
		`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(q)}`,
		{ waitUntil: "domcontentloaded" },
	);
	// Wait for search results table
	await page.waitForSelector('table[role="grid"] tr', { timeout: 15000 });
	// Click the first email row
	const firstRow = await page.$('table[role="grid"] tr');
	if (!firstRow) throw new Error("No search rows found");
	await firstRow.click();
	// Wait for message view to render - 'div[role="main"] img' etc.
	await page.waitForSelector('div[role="main"]', { timeout: 10000 });
}

export const worker = new Worker<ScreenshotJobData>(
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
