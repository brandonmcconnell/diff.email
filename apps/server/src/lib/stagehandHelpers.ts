import { Stagehand } from "@browserbasehq/stagehand";
import logger from "@diff-email/logger";
import type { Client } from "@diff-email/shared";

/**
 * Internal helper – run a natural-language Stagehand instruction while
 * attaching to an already running Browserbase session via its ID.
 */
async function stagehandAct(
	sessionId: string,
	instruction: string,
): Promise<void> {
	const sh = new Stagehand({
		env: "BROWSERBASE",
		apiKey: process.env.BROWSERBASE_API_KEY,
		projectId: process.env.BROWSERBASE_PROJECT_ID,
		browserbaseSessionID: sessionId,
		verbose: 0,
		disablePino: true,
	});

	await sh.init();
	const [action] = await sh.page.observe(instruction);
	await sh.page.act(action);
	await sh.close();
}

export async function loginWithStagehand(
	sessionId: string,
	client: Client,
): Promise<void> {
	const msg =
		client === "icloud"
			? "Sign in to iCloud Mail so the mailbox list becomes visible. Use the stored credentials and 2-FA if prompted."
			: `Sign in to ${client} so the inbox is visible. Use the stored credentials.`;
	await stagehandAct(sessionId, msg);
	logger.info({ client }, "Stagehand completed login");
}

export async function searchEmailWithStagehand(
	sessionId: string,
	client: Client,
	subjectToken: string,
): Promise<void> {
	const msg =
		client === "icloud"
			? `Find the email whose subject contains "${subjectToken}" and open it. Wait until the message body is visible.`
			: `Use the mailbox search input to search for "${subjectToken}" and open the first result.`;
	await stagehandAct(sessionId, msg);
	logger.info({ client }, "Stagehand opened the email");
}

export async function clickShowImagesWithStagehand(
	sessionId: string,
): Promise<void> {
	const msg =
		"If a button or link labelled 'Show images' is present in the open email, click it. Otherwise do nothing.";
	await stagehandAct(sessionId, msg);
	logger.info("Stagehand attempted Show images click");
}
