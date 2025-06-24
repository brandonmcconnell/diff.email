import "dotenv/config";
import { promises as fs } from "node:fs";
import process from "node:process";
import type { Client, Engine } from "@diff-email/shared";
import { Command } from "commander";
import { type BrowserContext, chromium, firefox, webkit } from "playwright";
import { selectors } from "./selectors";

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
	.option("--engine <engine>", "single engine id (chromium|firefox|webkit)");

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

	const browserType =
		engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium;
	let browser: import("playwright").Browser | undefined;
	let ctx: BrowserContext | undefined;
	try {
		browser = await browserType.launch({ headless: true });
		ctx = await browser.newContext({ storageState });
		const page = await ctx.newPage();

		const baseUrls: Record<Client, string> = {
			gmail: "https://mail.google.com/mail/u/0/#inbox",
			outlook: "https://outlook.live.com/mail/0/",
			yahoo: "https://mail.yahoo.com/",
			aol: "https://mail.aol.com/",
			icloud: "https://www.icloud.com/mail",
		};
		await page.goto(baseUrls[client], { waitUntil: "domcontentloaded" });
		await page.waitForSelector(selectors[client].searchInput, {
			timeout: 8_000,
		});
		return true;
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
	const engines: Engine[] = singleEngine
		? [singleEngine]
		: ["chromium", "firefox", "webkit"];

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
