import "dotenv/config";
import { promises as fs } from "node:fs";
import logger from "@diff-email/logger";
import { put } from "@vercel/blob";
import { type Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { chromium, firefox, webkit } from "playwright";

// --- Shared imports from the server package ------------------------------
import { db } from "@server/db";
import { run, screenshot } from "@server/db/schema/core";
import {
	type ScreenshotJobData,
	redis,
	screenshotsQueue,
} from "@server/lib/queue";

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
	const {
		runId,
		html,
		client,
		engine,
		dark,
		subjectToken: _subjectToken,
		messageId: _messageId,
	} = job.data;

	// Choose browser type
	const browserType =
		engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium;

	// Attempt to load persistent context with storage state
	const storageStatePath = await getStorageStatePath(client, engine);

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

	// For now we keep the original setContent flow; will be replaced by inbox
	// deep-linking / subject search in a follow-up commit.
	await page.setContent(html, { waitUntil: "load" });

	const buffer = await page.screenshot();
	await context.close();

	// Upload screenshot
	const { url } = await put(`screenshots/${job.id}.png`, buffer, {
		access: "public",
		token: blobToken,
	});

	// Insert DB row
	await db.insert(screenshot).values({
		runId,
		client,
		engine,
		darkMode: dark,
		url,
	});
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

worker.on("completed", async (job: Job<ScreenshotJobData>) => {
	const rows = await db
		.select({ id: screenshot.id })
		.from(screenshot)
		.where(eq(screenshot.runId, job.data.runId));

	if (rows.length >= 15) {
		await db
			.update(run)
			.set({ status: "done" })
			.where(eq(run.id, job.data.runId));
	}
});

worker.on("failed", (job: Job<ScreenshotJobData> | undefined, err: unknown) => {
	logger.error({ jobId: job?.id, err }, "Job failed");
});
