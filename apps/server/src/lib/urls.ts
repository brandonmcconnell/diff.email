import type { Client } from "@diff-email/shared";

// Centralized URL maps used throughout the server for each email client.
// Modify these in one place to change navigation targets everywhere.

export const inboxUrls: Record<Client, string> = {
	gmail: "https://mail.google.com/mail/u/0/#inbox",
	outlook: "https://outlook.live.com/mail/0/",
	yahoo: "https://mail.yahoo.com/n/inbox/all",
	aol: "https://mail.aol.com/d/folders/1",
	icloud: "https://www.icloud.com/mail",
};

export const loginUrls: Record<Client, string> = {
	gmail: "https://mail.google.com/mail/u/0/#inbox",
	outlook: "https://outlook.live.com/mail/0/?prompt=select_account",
	yahoo: "https://login.yahoo.com/?.done=https%3A%2F%2Fmail.yahoo.com%2Fd",
	aol: "https://oidc.mail.aol.com/login?dest=https://mail.aol.com/d/folders/1",
	icloud: "https://www.icloud.com/mail",
};
