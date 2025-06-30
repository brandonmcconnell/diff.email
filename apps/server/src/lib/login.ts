import logger from "@diff-email/logger";
import type { Client } from "@diff-email/shared";
import type { Page } from "playwright-core";
import Twilio from "twilio";
import { generateOtp } from "./otp";

function env(key: string): string {
	const val = process.env[key];
	if (!val) throw new Error(`Missing env var ${key}`);
	return val;
}

const twilioClient = Twilio(
	process.env.TWILIO_ACCOUNT_SID ?? "",
	process.env.TWILIO_AUTH_TOKEN ?? "",
);
const twilioNumber = process.env.TWILIO_NUMBER;

async function waitForAppleSmsCode(
	timeoutMs = 60_000,
): Promise<string | undefined> {
	if (!twilioNumber) return undefined;
	const deadline = Date.now() + timeoutMs;
	const re = /\b(\d{6})\b/;
	while (Date.now() < deadline) {
		try {
			const msgs = await twilioClient.messages.list({
				to: twilioNumber,
				limit: 10,
			});
			for (const m of msgs) {
				const mBody = (m.body ?? "").trim();
				const match = mBody.match(re);
				if (match) return match[1];
			}
		} catch (_) {
			/* network error – try again */
		}
		await new Promise((r) => setTimeout(r, 3000));
	}
	return undefined;
}

export async function ensureLoggedIn(
	page: Page,
	client: Client,
): Promise<void> {
	const log = logger.child({ fn: "ensureLoggedIn", client });
	const searchSel = selectors[client].searchInput;
	if (await page.$(searchSel)) {
		log.debug("Already logged in");
		return;
	}

	log.warn("Not logged in – running login flow");
	switch (client) {
		case "gmail":
			await loginGmail(page);
			break;
		case "outlook":
			await loginOutlook(page);
			break;
		case "yahoo":
			await loginYahoo(page);
			break;
		case "aol":
			await loginAol(page);
			break;
		case "icloud":
			await loginIcloud(page);
			break;
		default:
			throw new Error(`Unsupported client ${client}`);
	}

	// Verify search input appears
	await page.waitForSelector(searchSel, { timeout: 30_000 });
	log.info("Login successful");
}

// Gmail login implementation (username/password + OTP)
async function loginGmail(page: Page): Promise<void> {
	const email = env("GMAIL_USER");
	const pass = env("GMAIL_PASS");
	const secret = env("GMAIL_TOTP_SECRET");

	await page.goto("https://mail.google.com", { waitUntil: "domcontentloaded" });

	await page.waitForSelector("input[type=email]", { timeout: 5000 });
	await page.fill("input[type=email]", email);
	await page.click("#identifierNext button");

	// If Google prompts for passkey, choose password path instead
	try {
		await page.waitForSelector(
			"button:text('Use a different device'), button:text('Try another way'), a:text('Try another way')",
			{ timeout: 5000 },
		);
		await page.click(
			"button:text('Try another way'), a:text('Try another way')",
		);
		await page.click("div:text('Enter your password')");
	} catch (_) {}

	await page.waitForSelector("input[type=password]", { timeout: 20_000 });
	await page.fill("input[type=password]", pass);
	await page.click("#passwordNext button");

	// OTP step
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			await page.waitForSelector("input[type=tel], input[name=totpPin]", {
				timeout: 10_000,
			});
			const code = generateOtp(secret);
			await page.fill("input[type=tel], input[name=totpPin]", code);
			await page.click("#totpNext button");
			// wait for redirect to inbox
			await page.waitForURL(/mail\.google\.com\/mail/, { timeout: 15_000 });
			await page.goto("https://mail.google.com/mail/u/0/#inbox", {
				waitUntil: "domcontentloaded",
			});
			break;
		} catch (err) {
			if (attempt === 2) throw err;
			await page.waitForTimeout(30_000); // wait for next code window
		}
	}
}

async function loginOutlook(page: Page): Promise<void> {
	const email = env("OUTLOOK_USER");
	const pass = env("OUTLOOK_PASS");
	const secret = env("OUTLOOK_TOTP_SECRET");

	await page.goto("https://outlook.live.com/mail/0/?prompt=select_account", {
		waitUntil: "domcontentloaded",
	});

	await page.fill("input[type=email]", email);
	await page.keyboard.press("Enter");

	// Outlook might show a WebAuthn/passkey sheet with a "Sign-in options" link.
	try {
		await page.waitForSelector(
			"a:text('Sign-in options'), button:text('Sign-in options')",
			{ timeout: 5000 },
		);
		await page.click(
			"a:text('Sign-in options'), button:text('Sign-in options')",
		);
		await page.click("button:text('Password')");
	} catch (_) {}

	await page.waitForSelector("input[type=password]", { timeout: 20000 });
	await page.fill("input[type=password]", pass);
	await page.keyboard.press("Enter");

	// OTP loop (if prompted)
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			await page.waitForSelector(".fui-Input input, #otc-confirmation-input", {
				timeout: 10000,
			});
			const code = generateOtp(secret);
			await page.fill(".fui-Input input, #otc-confirmation-input", code);
			await page.keyboard.press("Enter");
			// Outlook might show a WebAuthn/passkey sheet with a "Sign-in options" link.
			try {
				await page.waitForSelector(
					"button[data-testid='secondaryButton'], button:text('Skip for now')",
					{ timeout: 5000 },
				);
				await page.click(
					"button[data-testid='secondaryButton'], button:text('Skip for now')",
				);
			} catch (_) {}
			// Outlook might ask to stay signed in.
			try {
				await page.waitForSelector("button:text('Yes')", { timeout: 5000 });
				await page.click("button:text('Yes')");
			} catch (_) {}
			await page.waitForURL(/outlook\.live\.com\/mail/, { timeout: 15000 });
			await page.goto("https://outlook.live.com/mail/0/", {
				waitUntil: "domcontentloaded",
			});
			break;
		} catch (err) {
			if (attempt === 2) throw err;
			await page.waitForTimeout(30000);
		}
	}
}

async function loginYahoo(page: Page): Promise<void> {
	const email = env("YAHOO_USER");
	const pass = env("YAHOO_PASS");
	const secret = env("YAHOO_TOTP_SECRET");

	await page.goto(
		"https://login.yahoo.com/?.done=https%3A%2F%2Fmail.yahoo.com%2Fd",
		{ waitUntil: "domcontentloaded" },
	);

	await page.fill("input[name='username']", email);
	await page.click("input#login-signin");

	// Yahoo may suggest a passkey / push prompt first
	try {
		await page.waitForSelector(
			"a:text('Sign in another way'), button:text('Sign in another way')",
			{ timeout: 5000 },
		);
		await page.click(
			"a:text('Sign in another way'), button:text('Sign in another way')",
		);
		await page.click("button:text('Password')");
	} catch (_) {}

	await page.waitForSelector("input[name='password']", { timeout: 20000 });
	await page.fill("input[name='password']", pass);
	await page.click("button#login-signin");

	// AOL can also ask to stay verified
	try {
		await page.waitForSelector(
			"button[name='rememberMe'].puree-button-primary",
			{ timeout: 5000 },
		);
		await page.click("button[name='rememberMe'].puree-button-primary");
	} catch (_) {}

	// OTP step
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			await page.waitForSelector(
				"input[name='code'], input#verification-code-field",
				{ timeout: 10000 },
			);
			const code = generateOtp(secret);
			await page.fill(
				"input[name='code'], input#verification-code-field",
				code,
			);
			await page.click("button#verify-code-button, button[name='verifyCode']");
			// Yahoo can also present passkey option here
			try {
				await page.waitForSelector("a.not-now", { timeout: 5000 });
				await page.click("a.not-now");
			} catch (_) {}
			// wait for redirect to any AOL page then navigate to mail
			await page.waitForURL(/mail\.yahoo\.com/, { timeout: 15000 });
			await page.goto("https://mail.yahoo.com/n/inbox/all", {
				waitUntil: "domcontentloaded",
			});
			break;
		} catch (err) {
			if (attempt === 2) throw err;
			await page.waitForTimeout(30_000); // wait for next code window
		}
	}
}

async function loginAol(page: Page): Promise<void> {
	const email = env("AOL_USER");
	const pass = env("AOL_PASS");
	const secret = env("AOL_TOTP_SECRET");

	await page.goto("https://login.aol.com", { waitUntil: "domcontentloaded" });
	await page.fill("input[name='username']", email);
	await page.click("input#login-signin");

	await page.waitForSelector("input[name='password']", { timeout: 20000 });
	await page.fill("input[name='password']", pass);
	await page.click("button#login-signin");

	// AOL can also present passkey option first
	try {
		await page.waitForSelector("a.not-now", { timeout: 5000 });
		await page.click("a.not-now");
	} catch (_) {}

	// AOL can also ask to stay verified
	try {
		await page.waitForSelector(
			"button[name='rememberMe'].puree-button-primary",
			{ timeout: 5000 },
		);
		await page.click("button[name='rememberMe'].puree-button-primary");
	} catch (_) {}

	// OTP step
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			await page.waitForSelector(
				"input[name='code'], input#verification-code-field",
				{ timeout: 10000 },
			);
			const code = generateOtp(secret);
			await page.fill(
				"input[name='code'], input#verification-code-field",
				code,
			);
			await page.click("button#verify-code-button, button[name='verifyCode']");
			// AOL can also present passkey option here
			try {
				await page.waitForSelector("a.not-now", { timeout: 5000 });
				await page.click("a.not-now");
			} catch (_) {}
			// wait for redirect to any AOL page then navigate to mail
			await page.waitForURL(/www\.aol\.com/, { timeout: 15000 });
			await page.goto("https://mail.aol.com/d/folders/1", {
				waitUntil: "domcontentloaded",
			});
			break;
		} catch (err) {
			if (attempt === 2) throw err;
			await page.waitForTimeout(30_000); // wait for next code window
		}
	}
}

async function loginIcloud(page: Page): Promise<void> {
	const email = env("ICLOUD_USER");
	const pass = env("ICLOUD_PASS");

	await page.goto("https://www.icloud.com/mail", {
		waitUntil: "domcontentloaded",
	});

	// Click the big blue "Sign in" button which loads the Apple ID auth iframe
	try {
		await page.waitForSelector("ui-button.sign-in-button", { timeout: 10_000 });
		await page.click("ui-button.sign-in-button");
	} catch (_) {
		/* button might not exist if we were redirected straight to iframe */
	}

	// From this point on we operate within the auth iframe. Because Apple often
	// reloads or replaces the iframe, we resolve the locator fresh each step.
	const iframeSelector = "iframe[src*='idmsa.apple.com/appleauth']";

	// Step 1: Apple-ID field
	const idField = page
		.frameLocator(iframeSelector)
		.locator("input#account_name_text_field");
	await idField.waitFor({ timeout: 15_000 });
	await idField.fill(email);
	await idField.press("Enter");

	// Step 2: Password field (iframe may refresh)
	const pwdField = page
		.frameLocator(iframeSelector)
		.locator("input#password_text_field");
	await pwdField.waitFor({ timeout: 20_000 });
	await pwdField.fill(pass);
	await pwdField.press("Enter");

	// Step 3: 2FA code prompt – we cannot automate, so detect and fail early
	try {
		await page
			.frameLocator(iframeSelector)
			.locator(".form-security-code-inputs")
			.waitFor({ timeout: 10_000 });

		// Click "Can't use this number?" link to send code via SMS
		try {
			const altBtn = page
				.frameLocator(iframeSelector)
				.locator("button#cannot-use-number");
			if (await altBtn.count()) await altBtn.click();
		} catch (_) {
			/* ignore */
		}

		// Ensure "Text code to [number]" option is chosen (Apple may offer call-me or other methods)
		try {
			const textBtn = page
				.frameLocator(iframeSelector)
				.locator("button:has-text('Text code')");
			if (await textBtn.count()) await textBtn.click();
		} catch (_) {
			/* ignore */
		}

		const code = await waitForAppleSmsCode();
		if (!code) {
			throw new Error("iCloud 2FA SMS code not received – manual login needed");
		}

		// Fill code digits (6)
		const digitInputs = page
			.frameLocator(iframeSelector)
			.locator(".form-security-code-input .form-security-code-input");
		try {
			const count = await digitInputs.count();
			if (count >= 6) {
				for (let i = 0; i < 6; i++) {
					await digitInputs.nth(i).fill(code[i]);
				}
			} else {
				await digitInputs.first().fill(code);
			}
			// click Continue if button exists
			const contBtn = page
				.frameLocator(iframeSelector)
				.locator(
					"button[type='submit'], button[data-testid='verify-continue'], button:text('Continue'), button:text('Trust')",
				);
			if (await contBtn.count()) await contBtn.click();
		} catch (e) {
			throw new Error("Failed to enter iCloud SMS code");
		}
	} catch (err) {
		// If timeout, assume no 2FA prompt (session already trusted) and continue
		if (err instanceof Error && err.message.includes("manual login")) throw err;
	}

	// Wait until mailbox UI loads (sidebar)
	await page.waitForSelector("div[aria-label='Mailbox List']", {
		timeout: 30_000,
	});
}

import { selectors } from "../app/api/screenshot-worker/selectors";
