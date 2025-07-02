import "dotenv/config";
import { promises as fs } from "node:fs";
import process from "node:process";
import type { Client, Engine } from "@diff-email/shared";
import { Command } from "commander";
import { type BrowserContext, chromium } from "playwright";
import { inboxUrls } from "../../../lib/urls";

// ---------------------------------------------------------------------------
// Helpers shared with cache/worker scripts -----------------------------------
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

async function downloadStorageState(
	client: Client,
	engine: Engine,
): Promise<string | undefined> {
	const key = `${envPrefix()}/sessions/${client}-${engine}.json`;
	const url = `https://blob.vercel-storage.com/${sessionsBucket}/${key}`;
	try {
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${sessionsToken}` },
		});
		if (!res.ok) return undefined;
		const buffer = Buffer.from(await res.arrayBuffer());
		const tmpPath = `/tmp/${client}-${engine}.json`;
		await fs.writeFile(tmpPath, buffer as NodeJS.ArrayBufferView);
		return tmpPath;
	} catch (_) {
		return undefined;
	}
}

// ---------------------------------------------------------------------------
// CLI options ---------------------------------------------------------------

const cli = new Command();
cli
	.option("--client <client>", "single client id (gmail|outlook|…)")
	.option("--engine <engine>", "single engine id (chromium)");

cli.parse(process.argv);

interface VerifyOpts {
	client?: Client;
	engine?: Engine;
}

const parsed = cli.opts() as VerifyOpts;
const singleClient = parsed.client;
const singleEngine = parsed.engine;

async function checkCombo(client: Client, engine: Engine): Promise<boolean> {
	const storageState = await downloadStorageState(client, engine);
	if (!storageState) return false;

	// Browserbase only supports Chromium; use Chromium unconditionally
	const browserType = chromium;
	let browser: import("playwright").Browser | undefined;
	let ctx: BrowserContext | undefined;
	try {
		browser = await browserType.launch({ headless: true });
		ctx = await browser.newContext({ storageState });
		const page = await ctx.newPage();

		await page.goto(inboxUrls[client], { waitUntil: "load" });

		// After navigation, give any automatic redirects a moment to settle.
		await page.waitForTimeout(3000);

		const finalUrl = page.url();

		// Map of mailbox hostnames
		const hostMap: Record<Client, string> = {
			gmail: "mail.google.com",
			outlook: "outlook.live.com",
			yahoo: "mail.yahoo.com",
			aol: "mail.aol.com",
			icloud: "icloud.com",
		};

		return finalUrl.includes(hostMap[client]);
	} catch {
		return false;
	} finally {
		await ctx?.close();
		await browser?.close();
	}
}

async function main(): Promise<void> {
	const clients: Client[] = singleClient
		? [singleClient]
		: ["gmail", "outlook", "yahoo", "aol", "icloud"];
	const engines: Engine[] = singleEngine ? [singleEngine] : ["chromium"];

	let failures = 0;
	for (const client of clients) {
		for (const engine of engines) {
			const ok = await checkCombo(client, engine);
			console.log(`${client}/${engine}: ${ok ? "✅" : "❌"}`);
			if (!ok) failures++;
		}
	}

	if (failures) {
		console.log(`\n${failures} combo(s) need re-login.`);
		process.exitCode = 1;
	} else {
		console.log("\nAll sessions look valid ✨");
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
