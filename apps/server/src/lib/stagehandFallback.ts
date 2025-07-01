import { Stagehand } from "@browserbasehq/stagehand";
import logger from "@diff-email/logger";
import type { Client } from "@diff-email/shared";
import type { Page } from "playwright-core";
import { generateOtp } from "./otp";
import { inboxUrls } from "./urls";

function env(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing environment variable: ${key}`);
	return value;
}

/**
 * Use Stagehand AI to locate and open the desired email when deterministic
 * selectors fail. The function assumes the page is already at the mailbox root.
 */
export async function openEmailWithStagehand(
	_page: Page,
	client: Client,
	subjectToken: string,
): Promise<void> {
	const log = logger.child({ fn: "openEmailWithStagehand", client });

	const sh = new Stagehand({
		env: "BROWSERBASE",
		apiKey: env("BROWSERBASE_API_KEY"),
		projectId: env("BROWSERBASE_PROJECT_ID"),
		verbose: 0,
		disablePino: true,
		browserbaseSessionCreateParams: {
			projectId: env("BROWSERBASE_PROJECT_ID"),
			browserSettings: {
				viewport: { width: 1024, height: 768 },
			},
		},
	});

	await sh.init();
	const shPage = sh.page;

	// Navigate to client inbox first using centralized mapping
	await shPage.goto(inboxUrls[client]);

	// Try deterministic observe/act first for speed; if it fails, fall back to
	// the Computer-Use agent for more flexible reasoning.
	try {
		const searchInstruction =
			client === "icloud"
				? `Find the email whose subject contains the text \"${subjectToken}\" and open it. Wait until the message body is visible.`
				: `Use the mailbox search input to search for \"${subjectToken}\" then open the first result.`;

		const [action] = await shPage.observe(searchInstruction);
		await shPage.act(action);
	} catch (deterministicErr) {
		log.warn(
			{ deterministicErr },
			"Observe/act failed – falling back to CU agent",
		);

		const agent = sh.agent({
			provider: "openai",
			model: "computer-use-preview",
			instructions:
				"You are a helpful assistant that can use a browser and operate a webmail UI to locate, open, and screenshot emails. Do not ask follow up questions, the user will trust your judgement.",
			options: { apiKey: env("OPENAI_API_KEY") },
		});

		await agent.execute(
			client === "icloud"
				? `Find the email whose subject contains the text "${subjectToken}" and open it. Wait until the message body is visible.`
				: `Use the mailbox search input to search for "${subjectToken}" then open the first result.`,
		);
	}

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
	{ user: string; pass: string; getTotp: () => string }
> = {
	gmail: {
		user: env("GMAIL_USER"),
		pass: env("GMAIL_PASS"),
		getTotp: () => generateOtp(env("GMAIL_TOTP_SECRET")),
	},
	outlook: {
		user: env("OUTLOOK_USER"),
		pass: env("OUTLOOK_PASS"),
		getTotp: () => generateOtp(env("OUTLOOK_TOTP_SECRET")),
	},
	yahoo: {
		user: env("YAHOO_USER"),
		pass: env("YAHOO_PASS"),
		getTotp: () => generateOtp(env("YAHOO_TOTP_SECRET")),
	},
	aol: {
		user: env("AOL_USER"),
		pass: env("AOL_PASS"),
		getTotp: () => generateOtp(env("AOL_TOTP_SECRET")),
	},
	icloud: {
		user: env("ICLOUD_USER"),
		pass: env("ICLOUD_PASS"),
		getTotp: () => {
			throw new Error("ICLOUD_TOTP_SECRET not implemented");
		},
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
		apiKey: env("BROWSERBASE_API_KEY"),
		projectId: env("BROWSERBASE_PROJECT_ID"),
		verbose: 0,
		disablePino: true,
	});

	await sh.init();
	const shPage = sh.page;

	const deterministicInstr: Record<Client, string> = {
		gmail: `Focus the email input field, enter "${creds.user}", submit, enter the password "${creds.pass}", and complete the 2-factor prompt with code "${creds.getTotp()}". Wait until the Gmail inbox search bar appears.`,
		outlook: `Enter "${creds.user}" in the email field, submit, enter "${creds.pass}" as password, provide the 2-factor code "${creds.getTotp()}", and wait for the Outlook sidebar to appear.`,
		yahoo: `Log in to Yahoo with user "${creds.user}", password "${creds.pass}", and verification code "${creds.getTotp()}" if prompted. Stop when the Yahoo Mail search bar is visible.`,
		aol: `Sign in to AOL Mail with "${creds.user}" / "${creds.pass}", use code "${creds.getTotp()}" if MFA is required, and wait for the inbox to load.`,
		icloud: `Sign in to iCloud Mail with Apple ID "${creds.user}" and password "${creds.pass}". Complete any prompts until the mailbox list appears.`,
	};

	try {
		const [act] = await shPage.observe(deterministicInstr[client]);
		await shPage.act(act);
	} catch (detErr) {
		log.warn({ detErr }, "Deterministic login failed – using CU agent");

		const cuAgent = sh.agent({
			provider: "openai",
			model: "computer-use-preview",
			instructions:
				"You are a helpful assistant that can log into email accounts in a browser UI. Complete the login flow without asking questions.",
			options: { apiKey: env("OPENAI_API_KEY") },
		});

		await cuAgent.execute(deterministicInstr[client]);
	}

	await shPage.extract("confirm that the mailbox UI is visible");
	log.info("Stagehand login complete");
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
		apiKey: env("BROWSERBASE_API_KEY"),
		projectId: env("BROWSERBASE_PROJECT_ID"),
		verbose: 0,
		disablePino: true,
	});

	await sh.init();
	const shPage = sh.page;

	const deterministicInstr =
		"Within the currently opened Gmail email, click the button labeled 'Show images' so that remote images are displayed, then wait until the images are visible.";

	try {
		const [act] = await shPage.observe(deterministicInstr);
		await shPage.act(act);
	} catch (detErr) {
		log.warn({ detErr }, "Deterministic click failed – using CU agent");
		const agent = sh.agent({
			provider: "openai",
			model: "computer-use-preview",
			instructions: "Enable remote images in the currently opened Gmail email.",
			options: { apiKey: env("OPENAI_API_KEY") },
		});
		await agent.execute(deterministicInstr);
	}

	await shPage.extract(
		"verify that inline images are now visible in the email body",
	);
	log.info("Stagehand clicked 'Show images' successfully");
	await sh.close();
}
