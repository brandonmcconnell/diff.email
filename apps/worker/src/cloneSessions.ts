// cloneSessions.ts – copy each dev session-storage JSON to preview & prod
// Usage: pnpm --filter worker clone-sessions
// Requires env var SESSIONS_STATE_READ_WRITE_TOKEN (RW token for the bucket).

import "dotenv/config";
import process from "node:process";
import { put } from "@vercel/blob";

import type { Client, Engine } from "@server/lib/queue";

// ----------------------------------------------------------------------------
// Config & helpers -----------------------------------------------------------
const bucket = process.env.SESSIONS_BUCKET ?? "diff-email-sessions";
const token = process.env.SESSIONS_STATE_READ_WRITE_TOKEN;
if (!token) {
	throw new Error("Missing SESSIONS_STATE_READ_WRITE_TOKEN env var");
}

const clients: Client[] = ["gmail", "outlook", "yahoo", "aol", "icloud"];
const engines: Engine[] = ["chromium", "firefox", "webkit"];
const combos = clients.flatMap((c) => engines.map((e) => `${c}-${e}`));

async function downloadDevFile(combo: string): Promise<ArrayBuffer | null> {
	const url = `https://blob.vercel-storage.com/${bucket}/dev/sessions/${combo}.json`;
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) return null;
	return await res.arrayBuffer();
}

async function cloneCombo(combo: string): Promise<void> {
	const buf = await downloadDevFile(combo);
	if (!buf) {
		console.warn(`⏭️  dev file missing for ${combo} — skipping`);
		return;
	}
	for (const prefix of ["preview", "prod"]) {
		const key = `${prefix}/sessions/${combo}.json`;
		await put(key, Buffer.from(buf), { token, access: "public" });
		console.log("✔ cloned", combo, "→", prefix);
	}
}

(async () => {
	for (const combo of combos) {
		try {
			await cloneCombo(combo);
		} catch (err) {
			console.error("❌ failed to clone", combo, err);
		}
	}
})();
