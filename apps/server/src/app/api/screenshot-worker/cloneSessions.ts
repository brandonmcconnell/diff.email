// @ts-nocheck

// // cloneSessions.ts – copy each dev session-storage JSON to preview & prod
// Usage: pnpm --filter worker clone-sessions
// Requires env var SESSIONS_STATE_READ_WRITE_TOKEN (RW token for the bucket).

import "dotenv/config";
import process from "node:process";
import type { Client, Engine } from "@diff-email/shared";
import { put } from "@vercel/blob";
import { Command } from "commander";

// ----------------------------------------------------------------------------
// Config & helpers -----------------------------------------------------------
const program = new Command();

program
	.option("--source <prefix>", "source env prefix", "dev")
	.option("--targets <list>", "comma-separated target prefixes", "preview,prod")
	.option("--force", "overwrite existing files in target prefixes")
	.option("--debug", "verbose output");

program.parse(process.argv);

const opts = program.opts<{
	source: string;
	targets: string;
	force?: boolean;
	debug?: boolean;
}>();

const bucket = process.env.SESSIONS_BUCKET ?? "diff-email-sessions";
const token = process.env.SESSIONS_STATE_READ_WRITE_TOKEN;
if (!token) {
	throw new Error("Missing SESSIONS_STATE_READ_WRITE_TOKEN env var");
}

const clients: Client[] = ["gmail", "outlook", "yahoo", "aol", "icloud"];
const engines: Engine[] = ["chromium", "firefox", "webkit"];
const combos = clients.flatMap((c) => engines.map((e) => `${c}-${e}`));

// derive storeId host like cacheSessions
const storeId = token
	.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)?.[1]
	?.toLowerCase();

async function downloadFile(
	prefix: string,
	combo: string,
): Promise<ArrayBuffer | null> {
	const urls = [
		storeId
			? `https://${storeId}.public.blob.vercel-storage.com/${prefix}/sessions/${combo}.json`
			: undefined,
		`https://blob.vercel-storage.com/${bucket}/${prefix}/sessions/${combo}.json`,
	].filter(Boolean) as string[];

	for (const url of urls) {
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (opts.debug) console.log("download check", url, res.status);
		if (res.ok) return await res.arrayBuffer();
	}
	return null;
}

async function cloneCombo(combo: string): Promise<void> {
	const buf = await downloadFile(opts.source, combo);
	if (!buf) {
		console.warn(`⏭️  dev file missing for ${combo} — skipping`);
		return;
	}
	const targets = opts.targets.split(",");
	for (const prefix of targets) {
		const key = `${prefix}/sessions/${combo}.json`;

		try {
			await put(key, Buffer.from(buf), {
				token,
				access: "public",
				allowOverwrite: !!opts.force,
			});
			console.log(
				`✅ cloned ${combo} → ${prefix}${opts.force ? " (overwritten)" : ""}`,
			);
		} catch (err: unknown) {
			if (
				!opts.force &&
				err instanceof Error &&
				err.message.includes("already exists")
			) {
				console.log(
					`🔄 skip existing ${combo} in ${prefix} (use --force to overwrite)`,
				);
				continue;
			}
			throw err;
		}
	}
}

export async function cloneSessions(
	options: Partial<typeof opts> = {},
): Promise<void> {
	const _merged = { ...opts, ...options };
	for (const combo of combos) {
		try {
			await cloneCombo(combo);
		} catch (err) {
			console.error("❌ failed to clone", combo, err);
		}
	}
}

// If run via CLI (`pnpm --filter worker run clone-sessions`) execute immediately
if (process.argv[1]?.endsWith("cloneSessions.ts")) {
	cloneSessions().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
