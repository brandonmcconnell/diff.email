// cacheSessions.ts – run locally to create/refresh session storage state files

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { put } from "@vercel/blob";
import { type BrowserType, chromium, firefox, webkit } from "playwright";

import type { Client, Engine } from "@server/lib/queue";

// ---------------------------------------------------------------------------
// Helper: rudimentary arg parser ------------------------------------------------
interface Args {
	client: Client;
	engine: Engine;
}

function parseArgs(): Args {
	const args = process.argv.slice(2);
	const out: Record<string, string> = {};
	for (let i = 0; i < args.length; i += 2) {
		const key = args[i]?.replace(/^--/, "");
		const val = args[i + 1];
		if (!key || !val) continue;
		out[key] = val;
	}
	const { client, engine } = out as Partial<Args>;
	if (!client || !engine) {
		console.error(
			"Usage: tsx cacheSessions.ts --client <gmail|outlook|yahoo|aol|icloud> --engine <chromium|firefox|webkit>",
		);
		process.exit(1);
	}
	return { client, engine } as Args;
}

const { client, engine } = parseArgs();

// ---------------------------------------------------------------------------
// Env vars & constants --------------------------------------------------------
const sessionsBucket = process.env.SESSIONS_BUCKET ?? "diff-email-sessions";
const sessionsToken = process.env.SESSIONS_STATE_READ_WRITE_TOKEN;
if (!sessionsToken) {
	throw new Error("Missing SESSIONS_STATE_READ_WRITE_TOKEN env var");
}

function envPrefix(): "dev" | "preview" | "prod" {
	if (process.env.VERCEL_ENV === "production") return "prod";
	if (process.env.VERCEL_ENV === "preview") return "preview";
	return "dev";
}

const key = `${envPrefix()}/sessions/${client}-${engine}.json`;
const uploadPath = `https://blob.vercel-storage.com/${sessionsBucket}/${key}`;

// ---------------------------------------------------------------------------
// Step 1: Launch headed browser & wait for operator login --------------------
const browserType: BrowserType =
	engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium;

(async () => {
	console.log(`Launching ${engine} for ${client}.`);
	const userDataDir = `/tmp/${client}-${engine}-cache`; // persistent dir
	const context = await browserType.launchPersistentContext(userDataDir, {
		headless: false,
	});
	const page = await context.newPage();

	// naive login URL mapping
	const loginUrl: Record<Client, string> = {
		gmail: "https://mail.google.com/",
		outlook: "https://outlook.live.com/mail/",
		yahoo: "https://mail.yahoo.com/",
		aol: "https://mail.aol.com/",
		icloud: "https://www.icloud.com/mail",
	};

	await page.goto(loginUrl[client]);

	console.log("\nPlease complete login in the opened browser window.");
	console.log("Once your inbox fully loads, press <Enter> here to continue.");

	await new Promise<void>((resolve) => {
		process.stdin.once("data", () => resolve());
	});

	console.log("Capturing storage state…");
	const statePath = path.join("/tmp", `${client}-${engine}.json`);
	await context.storageState({ path: statePath });

	await context.close();

	const buffer = await fs.readFile(statePath);
	console.log("Uploading to", uploadPath);
	await put(key, buffer, { access: "public", token: sessionsToken });

	console.log("✅ Session uploaded successfully.");
})();
