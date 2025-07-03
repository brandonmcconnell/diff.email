import type { Client } from "@diff-email/shared";

type SelectorGroup = {
	readonly searchInput: string;
	readonly searchResult: string;
	readonly messageBody: string;
};

export const selectors: Record<Client, SelectorGroup> = {
	gmail: {
		searchInput: "form[role='search'] input:not([disabled])",
		searchResult: "[role='main'] .bog > [data-thread-id]",
		messageBody: ".ii.gt",
	},
	outlook: {
		searchInput: "input#topSearchInput",
		searchResult: "[data-convid][role='option']",
		messageBody: "[role='document']",
	},
	yahoo: {
		searchInput:
			"[data-search-form-id] input:not([disabled]):not([aria-hidden=true])",
		searchResult: "[data-test-id='message-list-item'] [id^='email-subject-']",
		messageBody: "[data-test-id='message-view-body-content']",
	},
	aol: {
		searchInput:
			"[data-search-form-id] input:not([disabled]):not([aria-hidden=true])",
		searchResult:
			"[data-test-id='message-list-item'] [data-test-id='message-subject']",
		messageBody: "[data-test-id='message-view-body']",
	},
	icloud: {
		searchInput: "ui-autocomplete-token-field",
		searchResult: ".thread-list-item",
		messageBody: ".conversation-list-item iframe[sandbox]",
	},
};
