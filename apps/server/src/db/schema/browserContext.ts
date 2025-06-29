import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { clientEnum, engineEnum } from "./core";

// Holds the Browserbase Context ID for each (client, engine) pair so that we
// can reuse cookies and other session data across runs.
export const browserContext = pgTable("browser_contexts", {
	id: text("id").primaryKey(),
	client: clientEnum("client").notNull(),
	engine: engineEnum("engine").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
