import { Stagehand } from "@browserbasehq/stagehand";
import logger from "@diff-email/logger";
import type { Client } from "@diff-email/shared";
import { generateOtp } from "./otp";

type CredTool = {
	user: string;
	pass: string;
	totp?: () => string;
};

function getCredTool(client: Client): CredTool {
	switch (client) {
		case "gmail":
			return {
				user: process.env.GMAIL_USER ?? "",
				pass: process.env.GMAIL_PASS ?? "",
				totp: () => generateOtp(process.env.GMAIL_TOTP_SECRET ?? ""),
			};
		case "outlook":
			return {
				user: process.env.OUTLOOK_USER ?? "",
				pass: process.env.OUTLOOK_PASS ?? "",
				totp: () => generateOtp(process.env.OUTLOOK_TOTP_SECRET ?? ""),
			};
		case "yahoo":
			return {
				user: process.env.YAHOO_USER ?? "",
				pass: process.env.YAHOO_PASS ?? "",
				totp: () => generateOtp(process.env.YAHOO_TOTP_SECRET ?? ""),
			};
		case "aol":
			return {
				user: process.env.AOL_USER ?? "",
				pass: process.env.AOL_PASS ?? "",
				totp: () => generateOtp(process.env.AOL_TOTP_SECRET ?? ""),
			};
		case "icloud":
			return {
				user: process.env.ICLOUD_USER ?? "",
				pass: process.env.ICLOUD_PASS ?? "",
			};
	}
}

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
	const creds = getCredTool(client);

	const sh = new Stagehand({
		env: "BROWSERBASE",
		apiKey: process.env.BROWSERBASE_API_KEY,
		projectId: process.env.BROWSERBASE_PROJECT_ID,
		browserbaseSessionID: sessionId,
		verbose: 0,
		disablePino: true,
	});

	await sh.init();
	const otpValue = creds.totp?.() ?? "";
	const instruction =
		client === "icloud"
			? `Fill the username field with "${creds.user}", press Next, then type "${creds.pass}" and submit. Wait until the mailbox list is visible.`
			: `Fill the username/email field with "${creds.user}", press Next, then type "${creds.pass}" and submit. If a verification/OTP field appears, enter the code "${otpValue}". Wait until the inbox loads.`;

	const [action] = await sh.page.observe(instruction);
	await sh.page.act(action);
	await sh.close();
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
