"use server";

/**
 * Server actions for managing the product catalog.
 *
 * - createProduct / updateProduct: form-based mutations from /admin/products/*
 * - archiveProduct / restoreProduct: soft delete via the `active` flag, so
 *   historical orders that reference the product never break.
 * - setInventory: per-product per-date stock for the calendar/checkout to
 *   consult when validating add-to-cart.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { inventory, products } from "@/db/schema";
import { recordAudit } from "@/server/audit";

export type ProductFormInput = {
  productId?: string;
  slug: string;
  nameEn: string;
  nameTraditional?: string;
  subtitle?: string;
  description?: string;
  priceCents: number;
  unitLabel?: string;
  photoUrl?: string;
  leadTimeDays: number;
  minQty: number;
  sortOrder: number;
  active: boolean;
  allowsInstantCheckout: boolean;
};

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validate(input: ProductFormInput): string | null {
  if (!input.nameEn?.trim()) return "Name is required";
  if (!input.slug?.trim()) return "Slug is required";
  if (!/^[a-z0-9-]+$/.test(input.slug)) return "Slug may only contain lowercase letters, numbers, and dashes";
  if (!Number.isFinite(input.priceCents) || input.priceCents < 0) return "Price must be a positive number";
  if (!Number.isInteger(input.leadTimeDays) || input.leadTimeDays < 0) return "Lead time must be 0 or more days";
  if (!Number.isInteger(input.minQty) || input.minQty < 1) return "Minimum quantity must be at least 1";
  return null;
}

export async function createProduct(input: ProductFormInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const err = validate(input);
  if (err) return { ok: false, error: err };

  const slug = slugify(input.slug);

  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (existing) return { ok: false, error: `A product with slug "${slug}" already exists` };

  const [created] = await db
    .insert(products)
    .values({
      slug,
      nameEn: input.nameEn.trim(),
      nameTraditional: input.nameTraditional?.trim() || null,
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      unitLabel: input.unitLabel?.trim() || null,
      photoUrl: input.photoUrl?.trim() || null,
      leadTimeDays: input.leadTimeDays,
      minQty: input.minQty,
      sortOrder: input.sortOrder,
      active: input.active,
      allowsInstantCheckout: input.allowsInstantCheckout,
    })
    .returning({ id: products.id });

  if (!created) return { ok: false, error: "Failed to create product" };

  await recordAudit({
    actorId: session.user.id,
    entity: "product",
    entityId: created.id,
    action: "create",
    diff: { after: { ...input, slug } },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${created.id}`);
  // eslint-disable-next-line no-unreachable
  return { ok: true, id: created.id };
}

export async function updateProduct(input: ProductFormInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  if (!input.productId) return { ok: false, error: "Missing productId" };

  const err = validate(input);
  if (err) return { ok: false, error: err };

  const slug = slugify(input.slug);

  const [before] = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);
  if (!before) return { ok: false, error: "Product not found" };

  if (slug !== before.slug) {
    const [conflict] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (conflict && conflict.id !== input.productId) {
      return { ok: false, error: `A product with slug "${slug}" already exists` };
    }
  }

  await db
    .update(products)
    .set({
      slug,
      nameEn: input.nameEn.trim(),
      nameTraditional: input.nameTraditional?.trim() || null,
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      unitLabel: input.unitLabel?.trim() || null,
      photoUrl: input.photoUrl?.trim() || null,
      leadTimeDays: input.leadTimeDays,
      minQty: input.minQty,
      sortOrder: input.sortOrder,
      active: input.active,
      allowsInstantCheckout: input.allowsInstantCheckout,
      updatedAt: new Date(),
    })
    .where(eq(products.id, input.productId));

  await recordAudit({
    actorId: session.user.id,
    entity: "product",
    entityId: input.productId,
    action: "update",
    diff: {
      before: {
        slug: before.slug,
        nameEn: before.nameEn,
        priceCents: before.priceCents,
        active: before.active,
      },
      after: { slug, nameEn: input.nameEn, priceCents: input.priceCents, active: input.active },
    },
  });

  revalidatePath(`/admin/products/${input.productId}`);
  revalidatePath("/admin/products");
  return { ok: true, id: input.productId };
}

export async function archiveProduct(productId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await db
    .update(products)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(products.id, productId));

  await recordAudit({
    actorId: session.user.id,
    entity: "product",
    entityId: productId,
    action: "archive",
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function restoreProduct(productId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await db
    .update(products)
    .set({ active: true, updatedAt: new Date() })
    .where(eq(products.id, productId));

  await recordAudit({
    actorId: session.user.id,
    entity: "product",
    entityId: productId,
    action: "restore",
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function setInventory(input: {
  productId: string;
  date: string; // ISO yyyy-mm-dd
  quantityAvailable: number;
  soldOut: boolean;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (!Number.isInteger(input.quantityAvailable) || input.quantityAvailable < 0) {
    return { ok: false, error: "Quantity must be 0 or more" };
  }
  // Parse the calendar date in UTC so the row keys are stable regardless of
  // server timezone — inventory.date is a date column, not a timestamp.
  const date = new Date(`${input.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Invalid date" };

  const [existing] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.productId, input.productId), eq(inventory.date, date)))
    .limit(1);

  if (existing) {
    await db
      .update(inventory)
      .set({ quantityAvailable: input.quantityAvailable, soldOut: input.soldOut })
      .where(and(eq(inventory.productId, input.productId), eq(inventory.date, date)));
  } else {
    await db.insert(inventory).values({
      productId: input.productId,
      date,
      quantityAvailable: input.quantityAvailable,
      soldOut: input.soldOut,
    });
  }

  await recordAudit({
    actorId: session.user.id,
    entity: "inventory",
    entityId: `${input.productId}:${input.date}`,
    action: "update",
    diff: { after: { quantity: input.quantityAvailable, soldOut: input.soldOut } },
  });

  revalidatePath(`/admin/products/${input.productId}`);
  return { ok: true };
}
