import logger from "@diff-email/logger";

// Boot the BullMQ listener (side-effect). This is the same code that runs
// when Vercel executes src/index.ts in the wildcard route, but placing it
// here means we can rely on file-system routing instead of vercel.json.
import "../src/index";

export const config = {
	runtime: "nodejs18.x",
	maxDuration: 800,
	memory: 3072,
} as const;

export default async function handler(): Promise<Response> {
	logger.info("/api/worker ping received – listener already running");
	return new Response("Screenshot worker active", { status: 200 });
}
