import Browserbase from "@browserbasehq/sdk";
import type { Client, Engine } from "@diff-email/shared";
import { and, eq } from "drizzle-orm";
import {
	type Browser,
	chromium,
	firefox,
	type Page,
	webkit,
} from "playwright-core";
import { db } from "../db";
import { browserContext } from "../db/schema/browserContext";

// A typed wrapper around the Browserbase SDK that re-uses a persisted Context
// per (client, engine) combination. The context ID is stored in `browser_contexts`
// table so that cookies and localStorage survive across runs.
//
// The helper returns a connected Playwright Browser instance alongside the
// originating Session ID so that callers can close and clean up the remote
// resources deterministically.
export interface ConnectedSession {
	browser: Browser;
	page: Page;
	sessionId: string;
	cleanup: () => Promise<void>;
}

const bb = new Browserbase({
	apiKey: process.env.BROWSERBASE_API_KEY,
});

if (!process.env.BROWSERBASE_PROJECT_ID) {
	throw new Error("Missing BROWSERBASE_PROJECT_ID env var");
}

// Map the internal Engine type (chromium | firefox | webkit) to Playwright
// browser type helpers for connectOverCDP.
function getBrowserType(engine: Engine) {
	return engine === "firefox"
		? firefox
		: engine === "webkit"
			? webkit
			: chromium;
}

export async function connectBrowser(
	client: Client,
	engine: Engine,
): Promise<ConnectedSession> {
	// 1. Find or create a persisted Context ID for this (client, engine)
	let existing = (
		await db
			.select({ id: browserContext.id })
			.from(browserContext)
			.where(
				and(
					eq(browserContext.client, client),
					eq(browserContext.engine, engine),
				),
			)
	)[0];

	if (!existing) {
		const context = await bb.contexts.create({
			projectId: process.env.BROWSERBASE_PROJECT_ID!,
		});

		existing = { id: context.id } as const;

		await db.insert(browserContext).values({
			id: context.id,
			client,
			engine,
		});
	}

	// 2. Create a fresh session tied to that context (persisted)
	const session = await bb.sessions.create({
		projectId: process.env.BROWSERBASE_PROJECT_ID!,
		browserSettings: {
			context: {
				id: existing.id,
				persist: true,
			},
		},
	});

	// 3. Connect via CDP using Playwright-core
	const browserType = getBrowserType(engine);
	const browser = await browserType.connectOverCDP(session.connectUrl);
	const context = browser.contexts()[0];
	const page = context.pages()[0] ?? (await context.newPage());

	async function cleanup(): Promise<void> {
		try {
			await browser.close();
		} finally {
			// The Browserbase SDK does not currently expose a "delete" helper.
			// Closing the browser marks the session as completed automatically.
		}
	}

	return { browser, page, sessionId: session.id, cleanup };
}
