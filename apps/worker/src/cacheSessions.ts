// cacheSessions.ts – run locally to create/refresh session storage state files

import { promises as fs } from "node:fs";
import path from "node:path";
import "dotenv/config"; // load env vars from .env in this package
import process from "node:process";
import { put } from "@vercel/blob";
import { chromium, firefox, webkit } from "playwright";

import type { Client, Engine } from "@server/lib/queue";

// ---------------------------------------------------------------------------
// Helper: rudimentary arg parser ------------------------------------------------
interface Args {
	client: Client;
	engine: Engine;
	force: boolean;
	debug: boolean;
}

function parseArgs(): Args {
	// Remove standalone "--" tokens that pnpm inserts when passing args
	const argv = process.argv.slice(2).filter((t) => t !== "--");
	const out: Record<string, string> = {};
	let force = false;
	let debug = false;
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token === "--force") {
			force = true;
			continue;
		}
		if (token === "--debug") {
			debug = true;
			continue;
		}
		if (!token.startsWith("--")) continue;
		const key = token.replace(/^--/, "");
		const val = argv[i + 1];
		if (!val || val.startsWith("--")) continue;
		out[key] = val;
		i++; // skip value in next iteration
	}
	const { client, engine } = out as Partial<Omit<Args, "force" | "debug">>;
	if (!client || !engine) {
		console.error(
			"Usage: tsx cacheSessions.ts --client <gmail|outlook|yahoo|aol|icloud> --engine <chromium|firefox|webkit> [--force] [--debug]",
		);
		process.exit(1);
	}
	return { client, engine, force, debug } as Args;
}

const { client, engine, force, debug } = parseArgs();

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

// Derive the store host (<storeId>.public.blob.vercel-storage.com) from the
// read-write token: vercel_blob_rw_<storeId>_<secret>
const storeId = sessionsToken
	.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)?.[1]
	?.toLowerCase();
const blobUrlSub = storeId
	? `https://${storeId}.public.blob.vercel-storage.com/${key}`
	: undefined;
const blobUrlPath = `https://blob.vercel-storage.com/${sessionsBucket}/${key}`;

// ---------------------------------------------------------------------------
// Early exit if blob already exists and --force not provided -----------------
async function blobExists(): Promise<boolean> {
	const urls = blobUrlSub ? [blobUrlSub, blobUrlPath] : [blobUrlPath];
	for (const url of urls) {
		try {
			const res = await fetch(url, {
				method: "GET",
				headers: {
					Range: "bytes=0-0",
					Authorization: `Bearer ${sessionsToken}`,
				},
			});
			if (debug) console.log("skip check", url, res.status);
			if (res.status === 200 || res.status === 206) return true;
		} catch (err) {
			if (debug) console.log("skip check error", url, err);
		}
	}
	return false;
}

if (!force && (await blobExists())) {
	console.log(
		"🔄 session already exists, skip (use --force to refresh) ->",
		key,
	);
	process.exit(0);
}

// ---------------------------------------------------------------------------
// Step 1: Launch headed browser & wait for operator login --------------------
const browserType =
	engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium;

(async () => {
	console.log(`Launching ${engine} for ${client}.`);
	const userDataDir = `/tmp/${client}-${engine}-cache`;
	const context = await browserType.launchPersistentContext(userDataDir, {
		headless: false,
	});
	const page = await context.newPage();

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
	console.log("Uploading to", blobUrlPath);
	await put(key, buffer, { access: "public", token: sessionsToken });

	console.log("✅ Session uploaded successfully.");

	process.exit(0);
})();
