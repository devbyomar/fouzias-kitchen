import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Auth.js needs Node runtime (not Edge) for the Resend provider + Drizzle.
export const runtime = "nodejs";
