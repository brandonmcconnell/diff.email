import { Stagehand } from "@browserbasehq/stagehand";
import logger from "@diff-email/logger";
import type { Client } from "@diff-email/shared";
import { generateOtp } from "./otp";

// Cache one Stagehand instance per Browserbase session so we don't close the
// CDP connection mid-job.  Close it at the very end via `shutdownStagehand`.
const shCache = new Map<string, Stagehand>();

export async function shutdownStagehand(sessionId: string): Promise<void> {
	const inst = shCache.get(sessionId);
	if (inst) {
		try {
			await inst.close();
		} catch (_) {
			/* swallow */
		}
		shCache.delete(sessionId);
	}
}

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
	let sh = shCache.get(sessionId);
	if (!sh) {
		sh = new Stagehand({
			env: "BROWSERBASE",
			apiKey: process.env.BROWSERBASE_API_KEY,
			projectId: process.env.BROWSERBASE_PROJECT_ID,
			browserbaseSessionID: sessionId,
			verbose: 0,
			disablePino: true,
		});
		await sh.init();
		shCache.set(sessionId, sh);
	}

	const observed = await sh.page.observe(instruction);
	logger.info(
		{ instruction, actions: observed.length },
		"Stagehand observe result",
	);
	if (observed.length === 0) {
		// fallback: try a computer-use agent (OpenAI preview) if configured
		try {
			const agent = sh.agent({
				provider: "openai",
				model: "computer-use-preview",
				instructions: `You are a helpful assistant that can use a web browser to accomplish a single task precisely: ${instruction}`,
				options: process.env.OPENAI_API_KEY
					? { apiKey: process.env.OPENAI_API_KEY }
					: undefined,
			});
			await agent.execute(instruction);
			return;
		} catch (_) {
			throw new Error(
				`Stagehand computer-use agent failed for: ${instruction}`,
			);
		}
	}
	await sh.page.act(observed[0]!);
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
	const instruction = (() => {
		if (client === "icloud") {
			return `Navigate to https://www.icloud.com/mail. If a "Sign in" button is visible, click it to open the Apple-ID iframe. Fill the Apple-ID field with "${creds.user}" and press Enter, then fill the password field with "${creds.pass}" and press Enter. If a six-digit code prompt appears, retrieve the code manually or via SMS and enter it. Wait until the mailbox list appears on the left.`;
		}

		// webmail clients that use Google / Microsoft style pages
		const base =
			client === "gmail"
				? "https://mail.google.com"
				: client === "outlook"
					? "https://outlook.live.com/mail/0/"
					: client === "yahoo"
						? "https://mail.yahoo.com"
						: client === "aol"
							? "https://mail.aol.com"
							: "";
		return `Navigate to ${base}. If you land on a generic home page, click the "Sign in" link or button. Fill the email/username field with "${creds.user}" and continue. When the password input appears, type "${creds.pass}" and submit. If a 6-digit verification/OTP field appears, enter "${otpValue}". Wait until you see the inbox list.`;
	})();

	const actions = await sh.page.observe(instruction);
	if (actions.length === 0) {
		await sh.close();
		throw new Error(`Stagehand could not derive an action for: ${instruction}`);
	}
	await sh.page.act(actions[0]!);
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
