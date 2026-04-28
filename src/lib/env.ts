/**
 * Typed environment access.
 *
 * Validates required env vars at module load. Importing this from anywhere
 * server-side will throw a loud, descriptive error if the deployment is
 * misconfigured, instead of failing later with a confusing stack trace.
 *
 * NOTE: Only import from server code. Never reference NEXT_PUBLIC_* values
 * from here — those should be inlined where used so Next can statically
 * replace them at build time.
 */

import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SITE_URL: z.string().url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be ≥32 chars (openssl rand -base64 32)"),
  OWNER_EMAIL: z.string().min(1, "OWNER_EMAIL is required (comma-separated for multiple)"),
  AUTH_TRUST_HOST: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  // Email
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_TAX_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  // Rate limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see .env.example");
}

export const env = parsed.data;

/** Parse the comma-separated owner allowlist into a normalized Set. */
export function ownerEmailAllowlist(): Set<string> {
  return new Set(
    env.OWNER_EMAIL.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}
