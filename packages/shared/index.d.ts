export const ENGINES: readonly ["chromium", "firefox", "webkit"];
export type Engine = typeof ENGINES[number];
export const CLIENTS: readonly ["gmail", "outlook", "yahoo", "aol", "icloud"];
export type Client = typeof CLIENTS[number]; 