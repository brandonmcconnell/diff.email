// cacheSessions.ts – run locally to create/refresh session storage state files

import { promises as fs } from "node:fs";
import path from "node:path";
import "dotenv/config"; // load env vars from .env in this package
import { spawnSync } from "node:child_process";
import process from "node:process";
import type { Client, Engine } from "@diff-email/shared";
import { put } from "@vercel/blob";
import { Command } from "commander";
import { chromium } from "playwright";
import { inboxUrls } from "../../../lib/urls";

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

// key and URLs will be computed after CLI options are parsed

// ---------------------------------------------------------------------------
// Parse CLI early so we can use variables in subsequent consts --------------

const cli = new Command();

cli
	.requiredOption("--client <client>", "gmail|outlook|yahoo|aol|icloud")
	.requiredOption("--engine <engine>", "chromium")
	.option("--force", "overwrite existing session")
	.option("--debug", "verbose output");

cli.parse(process.argv);

interface CacheSessionsOpts {
	client: Client;
	engine: Engine;
	force?: boolean;
	debug?: boolean;
}

const opts = cli.opts() as Readonly<CacheSessionsOpts>;

const client = opts.client as Client;
const engine = opts.engine as Engine;
const force = !!opts.force;
const debug = !!opts.debug;

// ---------------------------------------------------------------------------
// Derived paths/URLs ---------------------------------------------------------

const key = `${envPrefix()}/sessions/${client}-${engine}.json`;
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

function sessionStillValid(): boolean {
	const cmd = `pnpm exec tsx src/app/api/screenshot-worker/verifySessions.ts --client ${client} --engine ${engine}`;
	const res = spawnSync(cmd, { stdio: "ignore", shell: true });
	return res.status === 0;
}

async function main(): Promise<void> {
	if (!force) {
		if (await blobExists()) {
			if (sessionStillValid()) {
				console.log("✅ session still valid, skip ->", key);
				return;
			}
			console.log("🔄 session invalid, refreshing ->", key);
		}
	}

	// ---------------------------------------------------------------------------
	// Step 1: Launch headed browser & wait for operator login --------------------
	const browserType = chromium;

	console.log(`Launching ${engine} for ${client}.`);
	const userDataDir = `/tmp/${client}-${engine}-cache`;
	const context = await browserType.launchPersistentContext(userDataDir, {
		headless: false,
	});
	const page = await context.newPage();

	await page.goto(inboxUrls[client]);

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
	await put(key, buffer, {
		access: "public",
		token: sessionsToken,
		allowOverwrite: true,
	});

	console.log("✅ Session uploaded successfully.");

	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
