import { spawnSync } from "node:child_process";

// Simple CLI passthrough: any extra flags (e.g. --force, --debug) are forwarded
// to every cache-sessions invocation.
const extra = process.argv.slice(2);

const clients = ["gmail", "outlook", "yahoo", "aol", "icloud"] as const;
const engines = ["chromium", "firefox", "webkit"] as const;

for (const client of clients) {
	for (const engine of engines) {
		console.log("\n▶ caching", client, engine);
		const res = spawnSync(
			"pnpm",
			[
				"--filter",
				"worker",
				"cache-sessions",
				"--",
				"--client",
				client,
				"--engine",
				engine,
				...extra,
			],
			{ stdio: "inherit" },
		);
		if (res.status !== 0) {
			console.error("❌ combo failed", client, engine);
			process.exit(res.status ?? 1);
		}
	}
}

console.log("\n✅ All combos processed.");
