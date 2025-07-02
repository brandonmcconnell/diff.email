import { spawnSync } from "node:child_process";
import { Command } from "commander";

const program = new Command();

program
	.option("--force", "overwrite existing session JSONs")
	.option("--debug", "verbose output from child scripts");

program.parse(process.argv);

interface CacheAllSessionsOpts {
	force?: boolean;
	debug?: boolean;
}

// Commander\'s .opts() isn\'t generic in the current @types, so we cast instead
const opts = program.opts() as Readonly<CacheAllSessionsOpts>;

const extra: string[] = [];
if (opts.force) extra.push("--force");
if (opts.debug) extra.push("--debug");

const clients = ["gmail", "outlook", "yahoo", "aol", "icloud"] as const;
const engines = ["chromium"] as const;

// Small helper to determine if a session JSON is still valid by invoking the
// verifier script for the given combo. Returns true if needs refresh.
function comboStale(client: string, engine: string): boolean {
	const cmd = `pnpm exec tsx src/app/api/screenshot-worker/verifySessions.ts --client ${client} --engine ${engine}`;
	const res = spawnSync(cmd, { stdio: "ignore", shell: true });
	return res.status !== 0; // non-zero ⇒ stale or missing
}

for (const client of clients) {
	for (const engine of engines) {
		if (!opts.force) {
			process.stdout.write(`🔍 checking ${client}/${engine} … `);
			if (!comboStale(client, engine)) {
				console.log("✅ valid");
				continue; // skip to next combo
			}
			console.log("❌ expired – recapturing");
		} else {
			console.log(`\n⚠️  --force supplied → recapturing ${client}/${engine}`);
		}

		console.log("▶ launching headed browser for", client, engine);
		const cmd =
			`pnpm exec tsx src/app/api/screenshot-worker/cacheSessions.ts --client ${client} --engine ${engine} ${extra.join(" ")}`.trim();
		const res = spawnSync(cmd, { stdio: "inherit", shell: true });
		if (res.status !== 0) {
			console.error("❌ combo failed", client, engine);
			process.exit(res.status ?? 1);
		}

		console.log(`✅ ${client}/${engine} refreshed successfully`);
	}
}

console.log("\n✅ All combos processed.");
