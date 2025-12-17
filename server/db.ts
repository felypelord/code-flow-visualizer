import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/codeflow";

// Create postgres connection
const client = postgres(dbUrl);

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };
