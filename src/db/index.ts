/**
 * Drizzle database client.
 *
 * Uses postgres-js (works with Neon, Supabase, Vercel Postgres, vanilla pg).
 * In dev we cache the connection on `globalThis` to survive hot-reloads
 * without exhausting the connection pool.
 */

import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__pgClient ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 10 : 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // safer with PgBouncer / Neon pooled connections
  });

if (env.NODE_ENV !== "production") {
  globalThis.__pgClient = client;
}

export const db = drizzle(client, { schema, logger: env.NODE_ENV === "development" });
export type DB = typeof db;
export { schema };
