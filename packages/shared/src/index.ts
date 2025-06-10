export const ENGINES = [
  "chromium",
  "firefox",
  "webkit",
] as const;

export type Engine = (typeof ENGINES)[number];

export const CLIENTS = [
  "gmail",
  "outlook",
  "yahoo",
  "aol",
  "icloud",
] as const;

export type Client = (typeof CLIENTS)[number]; 