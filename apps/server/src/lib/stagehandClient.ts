import Browserbase from "@browserbasehq/sdk";
import { Stagehand } from "@browserbasehq/stagehand";
import logger from "@diff-email/logger";
import type { Client, Engine } from "@diff-email/shared";
import { and, eq } from "drizzle-orm";
import type { Page } from "playwright-core";
import { selectors } from "../app/api/screenshot-worker/selectors";
import { db } from "../db";
import { browserContext } from "../db/schema/browserContext";
import { generateOtp } from "./otp";
import { inboxUrls } from "./urls";

function env(key: string): string {
	const v = process.env[key];
	if (!v) throw new Error(`Missing environment variable: ${key}`);
	return v;
}

// Centralised creds pulled from env – must exist at runtime.
interface Creds {
	user: string;
	pass: string;
	secret?: string; // undefined for providers without TOTP
}

const credsMap: Record<Client, Creds> = {
	gmail: {
		user: env("GMAIL_USER"),
		pass: env("GMAIL_PASS"),
		secret: env("GMAIL_TOTP_SECRET"),
	},
	outlook: {
		user: env("OUTLOOK_USER"),
		pass: env("OUTLOOK_PASS"),
		secret: env("OUTLOOK_TOTP_SECRET"),
	},
	yahoo: {
		user: env("YAHOO_USER"),
		pass: env("YAHOO_PASS"),
		secret: env("YAHOO_TOTP_SECRET"),
	},
	aol: {
		user: env("AOL_USER"),
		pass: env("AOL_PASS"),
		secret: env("AOL_TOTP_SECRET"),
	},
	icloud: {
		user: env("ICLOUD_USER"),
		pass: env("ICLOUD_PASS"),
	},
};

type SHPage = Page & {
	observe: (instruction: string) => Promise<[unknown, ...unknown[]]>;
	act: (action: unknown) => Promise<void>;
	extract: (instruction: string) => Promise<unknown>;
};

export class StagehandClient {
	readonly client: Client;
	readonly engine: Engine;
	private sh!: Stagehand; // set in init()
	page!: SHPage;
	public sessionId?: string;

	constructor(client: Client, engine: Engine) {
		this.client = client;
		this.engine = engine;
	}

	async init(): Promise<void> {
		const log = logger.child({
			fn: "StagehandClient.init",
			client: this.client,
		});

		// Reuse or create persisted Browserbase Context for this (client,engine)
		const projectId = env("BROWSERBASE_PROJECT_ID");
		const bb = new Browserbase({ apiKey: env("BROWSERBASE_API_KEY") });
		let ctxRow = (
			await db
				.select({ id: browserContext.id })
				.from(browserContext)
				.where(
					and(
						eq(browserContext.client, this.client),
						eq(browserContext.engine, this.engine),
					),
				)
		)[0];

		if (!ctxRow) {
			const created = await bb.contexts.create({ projectId });
			ctxRow = { id: created.id } as const;
			await db.insert(browserContext).values({
				id: created.id,
				client: this.client,
				engine: this.engine,
			});
			log.info(
				{
					event: "ctx.ready",
					contextId: created.id,
					reused: false,
					client: this.client,
					engine: this.engine,
				},
				"ctx.ready",
			);
		} else {
			log.debug(
				{
					event: "ctx.ready",
					contextId: ctxRow.id,
					reused: true,
					client: this.client,
					engine: this.engine,
				},
				"ctx.ready",
			);
		}
		this.sh = new Stagehand({
			env: "BROWSERBASE",
			apiKey: env("BROWSERBASE_API_KEY"),
			projectId,
			browserbaseSessionCreateParams: {
				projectId,
				browserSettings: {
					viewport: { width: 1024, height: 768 },
					context: {
						id: ctxRow.id,
						persist: true,
					},
				},
			},
			verbose: 0,
			disablePino: true,
		});

		await this.sh.init();

		// Try to capture the Browserbase session ID from internal Stagehand state.
		const possibleId = (this.sh as unknown as { session?: { id?: string } })
			.session?.id;
		if (possibleId) {
			this.sessionId = possibleId;
			log.info(
				{
					event: "session.open",
					sessionId: possibleId,
					client: this.client,
					engine: this.engine,
				},
				"session.open",
			);
		}

		this.page = this.sh.page as unknown as SHPage;

		// Set generous timeouts for slow providers
		this.page.setDefaultNavigationTimeout(120_000);
		this.page.setDefaultTimeout(60_000);

		log.info("Stagehand session started");
	}

	async login(): Promise<void> {
		const log = logger.child({
			fn: "StagehandClient.login",
			client: this.client,
		});
		const creds = credsMap[this.client];

		// Ensure we are on the mailbox domain so that the login UI is present.
		await this.page.goto(inboxUrls[this.client], {
			waitUntil: "domcontentloaded",
		});

		// Instruction string ensures: skip if already logged in, stay logged in.
		const baseInstr =
			"If the mailbox UI is already visible (search bar or sidebar), skip login entirely. Otherwise, sign in with the credentials provided.";
		let instrDetailed =
			`${baseInstr}\n\n` +
			`• Email: "${creds.user}"\n` +
			`• Password: "${creds.pass}"\n`;

		if (creds.secret) {
			instrDetailed += `• When prompted for a 6-digit verification code, generate a fresh code **right now** using the shared secret \\"${creds.secret}\\" (RFC-6238 TOTP) and enter it. If the code is rejected, immediately generate a new one and retry.\n`;
		}
		instrDetailed +=
			"After each form step, click the visible 'Next', 'Continue', or equivalent button to proceed until the inbox loads.";

		const t0 = Date.now();
		const agent = this.sh.agent({
			provider: "openai",
			model: "computer-use-preview",
			instructions: instrDetailed,
			options: { apiKey: env("OPENAI_API_KEY") },
		});
		await agent.execute(instrDetailed);
		log.info(
			{
				event: "login.agent",
				ms: Date.now() - t0,
				sessionId: this.sessionId,
				client: this.client,
				engine: this.engine,
			},
			"login.agent",
		);
	}

	async openEmail(subjectToken: string): Promise<void> {
		const log = logger.child({
			fn: "StagehandClient.openEmail",
			client: this.client,
		});

		await this.page.goto(inboxUrls[this.client]);

		const instr =
			`Use the mailbox user-interface to locate the email whose subject contains the exact text "${subjectToken}" (case-insensitive). ` +
			"Open that email (double-click or tap if needed). " +
			"Ensure the message body is fully visible before continuing.";

		const t0 = Date.now();
		try {
			const [step] = await this.page.observe(instr);
			await this.page.act(step);
			log.info(
				{
					event: "openEmail.cached",
					cached: true,
					ms: Date.now() - t0,
					sessionId: this.sessionId,
					client: this.client,
					engine: this.engine,
				},
				"openEmail.cached",
			);
		} catch (err) {
			log.warn(
				{
					event: "openEmail.observe_failed",
					fallback: true,
					err,
					sessionId: this.sessionId,
					client: this.client,
					engine: this.engine,
				},
				"openEmail.observe_failed",
			);
			const agent = this.sh.agent({
				provider: "openai",
				model: "computer-use-preview",
				instructions: instr,
				options: { apiKey: env("OPENAI_API_KEY") },
			});
			await agent.execute(instr);
			log.info(
				{
					event: "openEmail.fallback",
					cached: false,
					fallback: true,
					ms: Date.now() - t0,
					sessionId: this.sessionId,
					client: this.client,
					engine: this.engine,
				},
				"openEmail.fallback",
			);
		}

		// Confirm body visible
		await this.page.extract("confirm that the email body is visible");
	}

	async showRemoteImagesIfNeeded(): Promise<void> {
		if (this.client !== "gmail") return;
		const log = logger.child({
			fn: "StagehandClient.showImages",
			client: this.client,
		});
		const instr =
			"If a banner or button labelled 'Show images' is visible inside the open Gmail message, click it to display remote images. Then wait until inline images are visible before continuing.";
		const t0 = Date.now();
		try {
			const [step] = await this.page.observe(instr);
			await this.page.act(step);
			log.info(
				{
					event: "showImages.cached",
					cached: true,
					ms: Date.now() - t0,
					sessionId: this.sessionId,
					client: this.client,
					engine: this.engine,
				},
				"showImages.cached",
			);
		} catch (err) {
			log.warn(
				{
					event: "showImages.observe_failed",
					fallback: true,
					err,
					sessionId: this.sessionId,
					client: this.client,
					engine: this.engine,
				},
				"showImages.observe_failed",
			);
			const agent = this.sh.agent({
				provider: "openai",
				model: "computer-use-preview",
				instructions: instr,
				options: { apiKey: env("OPENAI_API_KEY") },
			});
			await agent.execute(instr);
			log.info(
				{
					event: "showImages.fallback",
					cached: false,
					fallback: true,
					ms: Date.now() - t0,
					sessionId: this.sessionId,
					client: this.client,
					engine: this.engine,
				},
				"showImages.fallback",
			);
		}
	}

	async screenshotBody(isDark: boolean): Promise<Buffer> {
		const t0 = Date.now();
		await this.page.emulateMedia({ colorScheme: isDark ? "dark" : "light" });
		// Move mouse to corner to avoid hover popovers
		await this.page.mouse.move(0, 0);
		const bodySelector = selectors[this.client].messageBody;
		const body = await this.page.waitForSelector(bodySelector, {
			timeout: 15_000,
		});
		if (!body) throw new Error("Message body element not found");
		// small settle time
		await this.page.waitForTimeout(2_000);
		const buf = await body.screenshot({ type: "png" });
		logger.info(
			{
				event: "screenshot",
				dark: isDark,
				bytes: buf.length,
				ms: Date.now() - t0,
				sessionId: this.sessionId,
				client: this.client,
				engine: this.engine,
			},
			"screenshot",
		);
		return buf;
	}

	async close(): Promise<void> {
		await this.sh.close();
	}
}
