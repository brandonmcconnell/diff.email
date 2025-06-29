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
