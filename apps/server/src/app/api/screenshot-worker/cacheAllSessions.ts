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
const engines = ["chromium", "firefox", "webkit"] as const;

for (const client of clients) {
	for (const engine of engines) {
		console.log("\n▶ caching", client, engine);
		const cmd =
			`pnpm --filter worker run cache-sessions --client ${client} --engine ${engine} ${extra.join(" ")}`.trim();
		const res = spawnSync(cmd, { stdio: "inherit", shell: true });
		if (res.status !== 0) {
			console.error("❌ combo failed", client, engine);
			process.exit(res.status ?? 1);
		}
	}
}

console.log("\n✅ All combos processed.");
