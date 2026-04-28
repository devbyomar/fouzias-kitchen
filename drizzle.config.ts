import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // Allow tooling to load even without a URL set; commands that need it will fail loudly.
  // eslint-disable-next-line no-console
  console.warn("[drizzle-kit] DATABASE_URL is not set — migrations will fail until you configure .env.local");
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://placeholder",
  },
  strict: true,
  verbose: true,
} satisfies Config;
