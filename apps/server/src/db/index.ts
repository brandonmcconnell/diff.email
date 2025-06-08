import { drizzle } from "drizzle-orm/node-postgres";

const connectionString =
	process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL || "";

export const db = drizzle(connectionString);
