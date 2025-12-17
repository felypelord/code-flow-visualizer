import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL || "postgresql://codeflow_user:Felype123!Secure@localhost:5432/codeflow";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
