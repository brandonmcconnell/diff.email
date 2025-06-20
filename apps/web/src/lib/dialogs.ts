"use client";

import type React from "react";
import type { z } from "zod";

/**
 * Public options for confirm() helper.
 */
export type ConfirmOptions = {
	title?: React.ReactNode;
	description?: React.ReactNode;
	/** Optional arbitrary JSX rendered between header and footer */
	content?: React.ReactNode;
	confirmText?: React.ReactNode;
	cancelText?: React.ReactNode;
	/** Apply destructive styling to primary button */
	variant?: "default" | "destructive";
	/** Whether the dialog can be closed via outside click / Esc. Defaults to false for confirm */
	dismissible?: boolean;
};

/**
 * Public options for prompt() helper.
 */
export type PromptOptions<T = string> = {
	title?: React.ReactNode;
	description?: React.ReactNode;
	/** Optional arbitrary JSX rendered between header and footer */
	content?: React.ReactNode;
	/** Placeholder inside the input. */
	placeholder?: string;
	/** Default value inside the input */
	defaultValue?: string;
	okText?: React.ReactNode;
	cancelText?: React.ReactNode;
	/** Whether the dialog can be closed via outside click / Esc. Defaults to true for prompt */
	dismissible?: boolean;
	/** Hide the text input (useful when using a schema instead). */
	showInput?: boolean;
	/** Provide a Zod schema to generate a form automatically. */
	schema?: z.ZodType<T>;
	/** Optional default values when using schema */
	defaultValues?: Partial<T>;
};

// ------------------------------------------------------------------------------------
// Internal implementation wires. A DialogProvider will register its concrete handlers
// at runtime. Until then, we reject so developers remember to mount the provider.
// ------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-use-before-define
let _confirmImpl: (opts: ConfirmOptions) => Promise<boolean> = () => {
	return Promise.reject(new Error("DialogProvider is not mounted"));
};
// eslint-disable-next-line @typescript-eslint/no-use-before-define
let _promptImpl: <T>(opts: PromptOptions<T>) => Promise<T | null> = () => {
	return Promise.reject(new Error("DialogProvider is not mounted"));
};

export function registerDialogHandlers(
	confirmImpl: (opts: ConfirmOptions) => Promise<boolean>,
	promptImpl: <T>(opts: PromptOptions<T>) => Promise<T | null>,
): void {
	_confirmImpl = confirmImpl;
	_promptImpl = promptImpl;
}

// ------------------------------------------------------------------------------------
// Public helpers ----------------------------------------------------------------------
// ------------------------------------------------------------------------------------

export function confirm(opts: ConfirmOptions): Promise<boolean> {
	return _confirmImpl(opts);
}

export function prompt<T = string>(opts: PromptOptions<T>): Promise<T | null> {
	// cast to satisfy runtime signature
	return _promptImpl(opts as PromptOptions<T>);
}
