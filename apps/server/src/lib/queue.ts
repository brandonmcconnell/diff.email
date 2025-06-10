import type { ScreenshotJobData } from "@diff-email/shared";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.UPSTASH_REDIS_TLS_URL ?? process.env.REDIS_URL;
if (!redisUrl) {
	throw new Error("Missing UPSTASH_REDIS_TLS_URL env var");
}

// BullMQ needs a Redis connection instance
export const redis = new IORedis(redisUrl, {
	// Upstash TLS urls already include rediss://
	maxRetriesPerRequest: null,
});

export const screenshotsQueue = new Queue<ScreenshotJobData>("screenshots", {
	connection: redis,
});
