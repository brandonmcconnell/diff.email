import Browserbase from "@browserbasehq/sdk";
import { Stagehand } from "@browserbasehq/stagehand";
import logger from "@diff-email/logger";
import type { Client, Engine } from "@diff-email/shared";
import { and, eq } from "drizzle-orm";
import type { Page } from "playwright-core";
import { selectors } from "../app/api/screenshot-worker/selectors";
import { db } from "../db";
import { browserContext } from "../db/schema/browserContext";
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
			log.info({ contextId: created.id }, "Created new Browserbase context");
		} else {
			log.debug({ contextId: ctxRow.id }, "Using existing Browserbase context");
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
		this.page = this.sh.page as unknown as SHPage;

		log.info("Stagehand session started");
	}

	async login(): Promise<void> {
		const log = logger.child({
			fn: "StagehandClient.login",
			client: this.client,
		});
		const creds = credsMap[this.client];

		// Instruction string ensures: skip if already logged in, stay logged in.
		const baseInstr =
			"If the mailbox UI is already visible (search bar or sidebar), skip login entirely. Otherwise, sign in with the credentials provided.";
		const instrDetailed =
			`${baseInstr}\n\n` +
			`• Email: "${creds.user}"\n` +
			`• Password: "${creds.pass}"\n` +
			(creds.secret
				? `• If prompted for 2-factor verification, generate a 6-digit TOTP code using secret "${creds.secret}" (RFC 6238) **at the moment of entry** and submit it. If the code is rejected, regenerate a fresh one and retry.\n`
				: "") +
			"Always opt to stay logged in when asked, and skip any prompts to add backup info.";

		try {
			const [step] = await this.page.observe(instrDetailed);
			await this.page.act(step);
			log.info("Login completed via observe/act");
		} catch (err) {
			log.warn({ err }, "observe/act login failed – falling back to CUA");
			const agent = this.sh.agent({
				provider: "openai",
				model: "computer-use-preview",
				instructions: instrDetailed,
				options: { apiKey: env("OPENAI_API_KEY") },
			});
			await agent.execute(instrDetailed);
		}
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

		try {
			const [step] = await this.page.observe(instr);
			await this.page.act(step);
			log.info("Email opened via observe/act");
		} catch (err) {
			log.warn({ err }, "observe/act open-email failed – using CUA");
			const agent = this.sh.agent({
				provider: "openai",
				model: "computer-use-preview",
				instructions: instr,
				options: { apiKey: env("OPENAI_API_KEY") },
			});
			await agent.execute(instr);
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
		try {
			const [step] = await this.page.observe(instr);
			await this.page.act(step);
			log.info("Show images done via observe/act");
		} catch (err) {
			log.warn({ err }, "observe/act show-images failed – using CUA");
			const agent = this.sh.agent({
				provider: "openai",
				model: "computer-use-preview",
				instructions: instr,
				options: { apiKey: env("OPENAI_API_KEY") },
			});
			await agent.execute(instr);
		}
	}

	async screenshotBody(isDark: boolean): Promise<Buffer> {
		await this.page.emulateMedia({ colorScheme: isDark ? "dark" : "light" });
		const bodySelector = selectors[this.client].messageBody;
		const body = await this.page.waitForSelector(bodySelector, {
			timeout: 15_000,
		});
		if (!body) throw new Error("Message body element not found");
		// small settle time
		await this.page.waitForTimeout(2_000);
		return body.screenshot({ type: "png" });
	}

	async close(): Promise<void> {
		await this.sh.close();
	}
}
