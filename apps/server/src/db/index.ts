import { drizzle } from "drizzle-orm/node-postgres";

const connectionString =
	process.env.DATABASE_URL || process.env.DATABASE_URL_POOLER;

if (!connectionString) {
	throw new Error("DATABASE_URL or DATABASE_URL_POOLER env var is required");
}

export const db = drizzle(connectionString);
