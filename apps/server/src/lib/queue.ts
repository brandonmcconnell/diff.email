import type { Client, Engine } from "@diff-email/shared";
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

export interface ScreenshotJobData {
	runId: string;
	html: string;
	client: Client;
	engine: Engine;
	dark: boolean;
	/**
	 * Optional subject token used by clients that rely on inbox search to open
	 * the rendered email (e.g., Yahoo, AOL). If omitted, the worker falls back
	 * to page.setContent(html).
	 */
	subjectToken?: string;
	/**
	 * Optional RFC-5322 Message-ID used by Gmail deep-linking.  When provided,
	 * the worker will attempt to open the exact message URL instead of
	 * injecting HTML via setContent().
	 */
	messageId?: string;
}

export const screenshotsQueue = new Queue<ScreenshotJobData>("screenshots", {
	connection: redis,
});
