/**
 * Server-only settings helpers. Settings are stored as a small key/value
 * table (jsonb values) so we can add new keys without migrations.
 *
 * Keep keys discoverable by enumerating the known shape in `SettingsShape`.
 */

import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type SettingsShape = {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  pickupAddress: string;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  taxRateBps: number; // basis points (e.g. 1300 = 13%)
  defaultLeadTimeDays: number;
  hoursNote: string;
  bookingNote: string;
};

export const DEFAULT_SETTINGS: SettingsShape = {
  storeName: "Fouzia's Kitchen",
  contactEmail: "hello@fouziaskitchen.com",
  contactPhone: "(416) 894-5755",
  pickupAddress: "Greater Toronto Area",
  deliveryFeeCents: 800,
  freeDeliveryThresholdCents: 7500,
  taxRateBps: 1300,
  defaultLeadTimeDays: 3,
  hoursNote: "Orders open Tue–Sun, 48–72h ahead.",
  bookingNote: "Custom orders by inquiry.",
};

export async function getSettings(): Promise<SettingsShape> {
  const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof SettingsShape>;
  const rows = await db.select().from(settings).where(inArray(settings.key, keys as string[]));

  const merged = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    const key = r.key as keyof SettingsShape;
    // Settings rows store typed JSON values; defaults provide the schema.
    (merged as Record<string, unknown>)[key] = r.value as SettingsShape[typeof key];
  }
  return merged;
}
