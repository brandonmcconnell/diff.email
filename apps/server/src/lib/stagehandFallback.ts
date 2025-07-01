import { Stagehand } from "@browserbasehq/stagehand";
import logger from "@diff-email/logger";
import type { Client } from "@diff-email/shared";
import type { Page } from "playwright-core";

/**
 * Use Stagehand AI to locate and open the desired email when deterministic
 * selectors fail. The function assumes the page is already at the mailbox root.
 */
export async function openEmailWithStagehand(
	page: Page,
	client: Client,
	subjectToken: string,
): Promise<void> {
	const log = logger.child({ fn: "openEmailWithStagehand", client });

	const sh = new Stagehand({
		env: "BROWSERBASE",
		apiKey: process.env.BROWSERBASE_API_KEY,
		projectId: process.env.BROWSERBASE_PROJECT_ID,
		verbose: 0,
		disablePino: true,
	});

	await sh.init();
	const shPage = sh.page;

	// Navigate to client inbox first
	const baseUrls: Record<Client, string> = {
		gmail: "https://mail.google.com/mail/u/0/#inbox",
		outlook: "https://outlook.live.com/mail/0/",
		yahoo: "https://mail.yahoo.com/",
		aol: "https://mail.aol.com/",
		icloud: "https://www.icloud.com/mail",
	};

	await shPage.goto(baseUrls[client]);

	const searchInstruction =
		client === "icloud"
			? `Find the email whose subject contains the text \"${subjectToken}\" and open it. Wait until the message body is visible.`
			: `Use the mailbox search input to search for \"${subjectToken}\" then open the first result.`;

	const [action] = await shPage.observe(searchInstruction);
	await shPage.act(action);

	// Ensure body is visible before returning (approx selectors).
	await shPage.extract("confirm that the email body is visible");

	log.info("Stagehand successfully opened the email");

	// Close Stagehand session
	await sh.close();
}

// ---------------------------------------------------------------------------
// Stagehand helper: log in to the mailbox using natural-language instructions.
// Each client uses placeholder credentials that will be replaced at deploy time.
// ---------------------------------------------------------------------------

const credentialPlaceholders: Record<
	Client,
	{ user: string; pass: string; totp?: string }
> = {
	gmail: {
		user: "GMAIL_USER_PLACEHOLDER",
		pass: "GMAIL_PASS_PLACEHOLDER",
		totp: "GMAIL_TOTP_PLACEHOLDER",
	},
	outlook: {
		user: "OUTLOOK_USER_PLACEHOLDER",
		pass: "OUTLOOK_PASS_PLACEHOLDER",
		totp: "OUTLOOK_TOTP_PLACEHOLDER",
	},
	yahoo: {
		user: "YAHOO_USER_PLACEHOLDER",
		pass: "YAHOO_PASS_PLACEHOLDER",
		totp: "YAHOO_TOTP_PLACEHOLDER",
	},
	aol: {
		user: "AOL_USER_PLACEHOLDER",
		pass: "AOL_PASS_PLACEHOLDER",
		totp: "AOL_TOTP_PLACEHOLDER",
	},
	icloud: {
		user: "ICLOUD_USER_PLACEHOLDER",
		pass: "ICLOUD_PASS_PLACEHOLDER",
	},
};

export async function loginWithStagehand(
	_page: Page,
	client: Client,
): Promise<void> {
	void _page; // parameter intentionally unused; Stagehand uses its own page context
	const log = logger.child({ fn: "loginWithStagehand", client });

	const creds = credentialPlaceholders[client];

	const sh = new Stagehand({
		env: "BROWSERBASE",
		apiKey: process.env.BROWSERBASE_API_KEY,
		projectId: process.env.BROWSERBASE_PROJECT_ID,
		verbose: 0,
		disablePino: true,
	});

	await sh.init();
	const shPage = sh.page;

	const instructionsByClient: Record<Client, string> = {
		gmail: `Navigate to Gmail and log in using the email address "${creds.user}" and password "${creds.pass}". If prompted for a two-factor authentication code, enter "${creds.totp}". Once the inbox is visible and the search input appears, stop.`,
		outlook: `Open Outlook Web and sign in with the username "${creds.user}" and password "${creds.pass}". Handle any MFA prompts with the code "${creds.totp}". Finish when the mailbox sidebar is visible.`,
		yahoo: `Go to Yahoo Mail and log in with the username "${creds.user}" and password "${creds.pass}". Provide the verification code "${creds.totp}" if asked. End when the inbox search bar is visible.`,
		aol: `Open AOL Mail and sign in with username "${creds.user}" and password "${creds.pass}". Use the code "${creds.totp}" if multi-factor authentication is requested. Conclude when the inbox loads and search is available.`,
		icloud: `Go to iCloud Mail and sign in with Apple ID "${creds.user}" and password "${creds.pass}". Complete any subsequent prompts. Finish when the mailbox list appears.`,
	};

	const [action] = await shPage.observe(instructionsByClient[client]);
	await shPage.act(action);

	// Quick extraction confirmation that login was successful
	await shPage.extract("confirm that the mailbox UI is visible");

	log.info("Stagehand successfully completed login");

	await sh.close();
}

// ---------------------------------------------------------------------------
// Stagehand helper: click the "Show images" button inside an open email.
// Currently only required for Gmail.
// ---------------------------------------------------------------------------
export async function clickShowImagesWithStagehand(
	_page: Page,
	client: Client,
): Promise<void> {
	void _page;
	if (client !== "gmail") return;

	const log = logger.child({ fn: "clickShowImagesWithStagehand", client });

	const sh = new Stagehand({
		env: "BROWSERBASE",
		apiKey: process.env.BROWSERBASE_API_KEY,
		projectId: process.env.BROWSERBASE_PROJECT_ID,
		verbose: 0,
		disablePino: true,
	});

	await sh.init();
	const shPage = sh.page;

	const [action] = await shPage.observe(
		"Within the currently opened Gmail email, click the button labeled 'Show images' so that remote images are displayed, then wait until the images are visible.",
	);
	await shPage.act(action);

	await shPage.extract(
		"verify that inline images are now visible in the email body",
	);

	log.info("Stagehand clicked 'Show images' successfully");

	await sh.close();
}
