import type { Client } from "@diff-email/shared";

export const searchInputSelectors: Record<Client, string> = {
	gmail: "form[role='search'] input:not([disabled])",
	outlook: "input#topSearchInput",
	yahoo: "[data-search-form-id] input:not([disabled]):not([aria-hidden=true])",
	aol: "[data-search-form-id] input:not([disabled]):not([aria-hidden=true])",
	icloud: "ui-autocomplete-token-field",
};

export const searchResultSelectors: Record<Client, string> = {
	gmail: "[role='main'] .bog > [data-thread-id]",
	outlook: "[data-convid][role='option']",
	yahoo: "[data-test-id='message-list-item'] [id^='email-subject-']",
	aol: "[data-test-id='message-list-item'] [data-test-id='message-subject']",
	icloud: ".thread-list-item",
};

export const messageBodySelectors: Record<Client, string> = {
	gmail: ".ii.gt",
	outlook: "[tabindex='0'][aria-label='Message body']",
	yahoo: "[data-test-id='message-view-body-content']",
	aol: "[data-test-id='message-view-body']",
	icloud: ".conversation-list-item iframe[sandbox]",
};
