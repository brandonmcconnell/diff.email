#!/usr/bin/env ts-node

// Import the queue and Redis connection from the existing configuration
import { redis, screenshotsQueue } from "./src/lib/queue";

async function clearAllJobs() {
	try {
		console.log("Clearing all jobs from the screenshots queue...");

		// Clean jobs in various states
		const activeJobs = await screenshotsQueue.clean(0, 0, "active");
		console.log(`Removed ${activeJobs} active jobs`);

		const completedJobs = await screenshotsQueue.clean(0, 0, "completed");
		console.log(`Removed ${completedJobs} completed jobs`);

		const failedJobs = await screenshotsQueue.clean(0, 0, "failed");
		console.log(`Removed ${failedJobs} failed jobs`);

		const waitingJobs = await screenshotsQueue.clean(0, 0, "wait");
		console.log(`Removed ${waitingJobs} waiting jobs`);

		const delayedJobs = await screenshotsQueue.clean(0, 0, "delayed");
		console.log(`Removed ${delayedJobs} delayed jobs`);

		// Drain the queue to ensure all jobs are removed
		console.log("Draining the queue...");
		await screenshotsQueue.drain();
		console.log("Queue drained successfully");

		console.log("All jobs have been cleared from the queue");
	} catch (error) {
		console.error("Error clearing jobs:", error);
	} finally {
		// Close connections gracefully
		console.log("Closing connections...");
		await screenshotsQueue.close();
		await redis.quit();
		console.log("Connections closed");
	}
}

// Execute the function
clearAllJobs();
