import { cloneSessions } from "../src/cloneSessions";

export const config = { runtime: "nodejs18.x", maxDuration: 800 } as const;

export default async function handler() {
	try {
		await cloneSessions({ force: true });
		return new Response("sessions cloned\n", { status: 200 });
	} catch (err) {
		console.error(err);
		return new Response("clone sessions failed\n", { status: 500 });
	}
}
