import { spawnSync } from "node:child_process";
import path from "node:path";

// Vercel function config
export const config = {
	runtime: "nodejs@22.6.0",
	maxDuration: 800,
};

export default async function handler(): Promise<Response> {
	const scriptPath = path.join(__dirname, "cloneSessions.js");
	const res = spawnSync("node", [scriptPath, "--force"], {
		stdio: "inherit",
	});

	if (res.status !== 0) {
		return new Response("cloneSessions failed", { status: 500 });
	}
	return new Response("sessions cloned", { status: 200 });
}
