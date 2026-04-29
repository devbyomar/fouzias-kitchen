import "server-only";

/**
 * Stripe client singleton.
 *
 * We pin the API version explicitly so Stripe upgrades behind the scenes
 * never silently change response shapes on us. Bump in lockstep with the
 * stripe SDK upgrade in package.json.
 */

import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Set it in your environment to enable payments.",
    );
  }
  _stripe = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    appInfo: {
      name: "fouzias-kitchen",
      version: "0.1.0",
    },
  });
  return _stripe;
}

/**
 * Currency we charge in. The bakery operates in CAD; if we ever expand we'll
 * key this off settings or per-order fields.
 */
export const STRIPE_CURRENCY = "cad";
