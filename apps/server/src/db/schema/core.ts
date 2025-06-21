import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
// Enums
export const runStatusEnum = pgEnum("run_status", [
	"pending",
	"running",
	"done",
	"error",
]);

export const clientEnum = pgEnum("client", [
	"gmail",
	"outlook",
	"yahoo",
	"aol",
	"icloud",
]);

export const engineEnum = pgEnum("engine", ["chromium", "firefox", "webkit"]);

export const emailLanguageEnum = pgEnum("email_language", ["html", "jsx"]);

// Tables
export const project = pgTable("projects", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull(),
	// foreign key reference will be added in a follow-up migration once user table is namespaced correctly
	name: text("name").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	// Optional description provided by the user
	description: text("description"),
});

export const email = pgTable("emails", {
	id: uuid("id").defaultRandom().primaryKey(),
	projectId: uuid("project_id")
		.notNull()
		.references(() => project.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	language: emailLanguageEnum("language").default("html").notNull(),
	// Optional description provided by the user
	description: text("description"),
});

export const version = pgTable("versions", {
	id: uuid("id").defaultRandom().primaryKey(),
	emailId: uuid("email_id")
		.notNull()
		.references(() => email.id, { onDelete: "cascade" }),
	html: text("html"),
	files: jsonb("files"),
	entryPath: text("entry_path"),
	exportName: text("export_name"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const run = pgTable("runs", {
	id: uuid("id").defaultRandom().primaryKey(),
	emailId: uuid("email_id")
		.notNull()
		.references(() => email.id, { onDelete: "cascade" }),
	versionId: uuid("version_id")
		.notNull()
		.references(() => version.id, { onDelete: "cascade" }),
	status: runStatusEnum("status").default("pending").notNull(),
	expectedShots: integer("expected_shots"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const screenshot = pgTable("screenshots", {
	id: uuid("id").defaultRandom().primaryKey(),
	runId: uuid("run_id")
		.notNull()
		.references(() => run.id, { onDelete: "cascade" }),
	client: clientEnum("client").notNull(),
	engine: engineEnum("engine").notNull(),
	darkMode: boolean("dark_mode").default(false).notNull(),
	url: text("url"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const sentEmail = pgTable("sent_emails", {
	id: uuid("id").defaultRandom().primaryKey(),
	versionId: uuid("version_id")
		.notNull()
		.references(() => version.id, { onDelete: "cascade" }),
	resendId: text("resend_id").notNull(),
	messageId: text("message_id"),
	to: text("to").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
