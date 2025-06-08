import { put } from "@vercel/blob";
import { type Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { chromium, firefox, webkit } from "playwright";
import { db } from "../db";
import { run, screenshot } from "../db/schema/core";
import { type ScreenshotJobData, redis, screenshotsQueue } from "../lib/queue";

const blobToken =
	process.env.SCREENSHOTS_PREVIEW_READ_WRITE_TOKEN || // dev / preview
	process.env.SCREENSHOTS_READ_WRITE_TOKEN; // production

if (!blobToken) {
	throw new Error("No blob token found in env vars");
}

async function processJob(job: Job<ScreenshotJobData>) {
	const { runId, html, client, engine, dark } = job.data;
	try {
		// Select engine
		const browserType =
			engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium;
		const browser = await browserType.launch();
		const page = await browser.newPage();

		// Dark mode emulation
		await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });

		// Load HTML
		await page.setContent(html, { waitUntil: "load" });

		const buffer = await page.screenshot();
		await browser.close();

		// Upload to Vercel Blob
		const { url } = await put(`screenshots/${job.id}.png`, buffer, {
			access: "public",
			token: blobToken,
		});

		// Insert screenshot record
		await db.insert(screenshot).values({
			runId,
			client,
			engine,
			darkMode: dark,
			url,
		});
	} catch (error) {
		console.error("Screenshot job failed", { jobId: job.id, error });
		throw error;
	}
}

export const worker = new Worker<ScreenshotJobData>(
	screenshotsQueue.name,
	processJob,
	{
		connection: redis,
		concurrency: 3,
	},
);

worker.on("completed", async (job) => {
	// Count remaining screenshots for this run
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

worker.on("failed", (job, err) => {
	console.error("Job failed", job?.id, err);
});
