/**
 * Database seed.
 *
 * Idempotent: run as many times as you like — products are upserted by slug,
 * demo data is only inserted when the orders table is empty.
 *
 * Usage: pnpm db:seed
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, schema } from "./index";

const PRODUCT_SEED: Array<typeof schema.products.$inferInsert> = [
  {
    slug: "kulcha-shor",
    nameEn: "Tea Biscuits",
    nameTraditional: "Kulcha-e-Shor",
    subtitle: "Tea Biscuits",
    description:
      "Buttery, lightly salted Afghan tea biscuits with a delicate crumb. The everyday companion to chai — equally at home on a wedding platter.",
    priceCents: 800,
    unitLabel: "per dozen",
    photoUrl: "/assets/product-kulcha-shor.jpg",
    leadTimeDays: 3,
    minQty: 1,
    sortOrder: 10,
    active: true,
    allowsInstantCheckout: true,
  },
  {
    slug: "simyan-mild",
    nameEn: "Simyan — Mild",
    nameTraditional: "Simyan",
    subtitle: "Savoury vermicelli",
    description: "Crisp savoury vermicelli, fragrant with cumin and herbs. Mild blend.",
    priceCents: 600,
    unitLabel: "per 200g",
    photoUrl: "/assets/product-simyan.jpg",
    leadTimeDays: 3,
    minQty: 1,
    sortOrder: 20,
    active: true,
    allowsInstantCheckout: true,
  },
  {
    slug: "simyan-spicy",
    nameEn: "Simyan — Spicy",
    nameTraditional: "Simyan",
    subtitle: "Savoury vermicelli",
    description: "Crisp savoury vermicelli with a warm chili kick. Spicy blend.",
    priceCents: 600,
    unitLabel: "per 200g",
    photoUrl: "/assets/product-simyan.jpg",
    leadTimeDays: 3,
    minQty: 1,
    sortOrder: 30,
    active: true,
    allowsInstantCheckout: true,
  },
  {
    slug: "khitai",
    nameEn: "Cardamom Shortbread",
    nameTraditional: "Kulcha-e-Khitai",
    subtitle: "Cardamom shortbread",
    description:
      "Snow-white shortbread perfumed with green cardamom — a celebration cookie that melts at the bite.",
    priceCents: 900,
    unitLabel: "per dozen",
    photoUrl: "/assets/product-khitai.jpg",
    leadTimeDays: 3,
    minQty: 1,
    sortOrder: 40,
    active: true,
    allowsInstantCheckout: true,
  },
  {
    slug: "panjerei",
    nameEn: "Rosette Cookies",
    nameTraditional: "Kulcha-e-Panjerei",
    subtitle: "Rosette Cookies",
    description:
      "Crisp lattice rosettes, dusted with sugar — fried in small batches the traditional way.",
    priceCents: 600,
    unitLabel: "per dozen",
    photoUrl: "/assets/product-panjerei.jpg",
    leadTimeDays: 3,
    minQty: 1,
    sortOrder: 50,
    active: true,
    allowsInstantCheckout: true,
  },
  {
    slug: "meringue",
    nameEn: "Meringue Cookies",
    nameTraditional: null,
    subtitle: "Crisp & cloud-light",
    description: "Crisp on the outside, cloud-light within. A delicate finish to any tea tray.",
    priceCents: 600,
    unitLabel: "per dozen",
    photoUrl: "/assets/product-meringue.jpg",
    leadTimeDays: 3,
    minQty: 1,
    sortOrder: 60,
    active: true,
    allowsInstantCheckout: true,
  },
];

async function seedProducts() {
  // eslint-disable-next-line no-console
  console.log("→ seeding products...");
  for (const p of PRODUCT_SEED) {
    await db
      .insert(schema.products)
      .values(p)
      .onConflictDoUpdate({
        target: schema.products.slug,
        set: {
          nameEn: p.nameEn,
          nameTraditional: p.nameTraditional,
          subtitle: p.subtitle,
          description: p.description,
          priceCents: p.priceCents,
          unitLabel: p.unitLabel,
          photoUrl: p.photoUrl,
          leadTimeDays: p.leadTimeDays,
          minQty: p.minQty,
          sortOrder: p.sortOrder,
          active: p.active,
          allowsInstantCheckout: p.allowsInstantCheckout,
          updatedAt: sql`now()`,
        },
      });
  }
  // eslint-disable-next-line no-console
  console.log(`  ✓ upserted ${PRODUCT_SEED.length} products`);
}

async function seedDemoData() {
  const [{ count }] = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.orders)) as Array<{ count: number }>;
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`→ ${count} orders already present; skipping demo data`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("→ seeding demo customers + orders...");

  const allProducts = await db.select().from(schema.products);
  const bySlug = new Map(allProducts.map((p) => [p.slug, p]));
  const kulcha = bySlug.get("kulcha-shor");
  const khitai = bySlug.get("khitai");
  const panjerei = bySlug.get("panjerei");
  if (!kulcha || !khitai || !panjerei) throw new Error("Seed product missing");

  const today = new Date();
  const inDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [c1] = await db
    .insert(schema.customers)
    .values({
      name: "Sarah Ahmadi",
      phone: "(416) 555-0142",
      email: "sarah.ahmadi@example.com",
      tags: ["vip"],
      notes: "Prefers Saturday afternoon pickup. Allergic to walnuts.",
    })
    .returning();
  const [c2] = await db
    .insert(schema.customers)
    .values({
      name: "Yusuf Khan",
      phone: "(647) 555-0118",
      email: "yusuf@example.com",
      tags: [],
    })
    .returning();
  const [c3] = await db
    .insert(schema.customers)
    .values({
      name: "Layla Hosseini",
      phone: "(905) 555-0177",
      email: "layla.h@example.com",
      tags: ["family"],
      notes: "Fatima's cousin — VIP family.",
    })
    .returning();
  if (!c1 || !c2 || !c3) throw new Error("Failed to seed customers");

  const orderSeeds = [
    {
      customerId: c1.id,
      requestedDate: inDays(2),
      fulfillmentType: "pickup" as const,
      status: "confirmed" as const,
      paymentStatus: "paid" as const,
      items: [
        { product: kulcha, qty: 2 },
        { product: khitai, qty: 1 },
      ],
    },
    {
      customerId: c2.id,
      requestedDate: inDays(5),
      fulfillmentType: "pickup" as const,
      status: "new" as const,
      paymentStatus: "unpaid" as const,
      items: [{ product: panjerei, qty: 3 }],
    },
    {
      customerId: c3.id,
      requestedDate: inDays(-1),
      fulfillmentType: "delivery" as const,
      status: "fulfilled" as const,
      paymentStatus: "paid" as const,
      items: [
        { product: kulcha, qty: 1 },
        { product: panjerei, qty: 1 },
        { product: khitai, qty: 2 },
      ],
    },
  ];

  for (const seed of orderSeeds) {
    const subtotalCents = seed.items.reduce(
      (sum, it) => sum + it.product.priceCents * it.qty,
      0,
    );
    const deliveryFeeCents = seed.fulfillmentType === "delivery" ? 800 : 0;
    const totalCents = subtotalCents + deliveryFeeCents;
    const [order] = await db
      .insert(schema.orders)
      .values({
        customerId: seed.customerId,
        status: seed.status,
        fulfillmentType: seed.fulfillmentType,
        requestedDate: seed.requestedDate,
        subtotalCents,
        deliveryFeeCents,
        totalCents,
        source: "manual",
        paymentStatus: seed.paymentStatus,
        amountPaidCents: seed.paymentStatus === "paid" ? totalCents : 0,
      })
      .returning();
    if (!order) throw new Error("Failed to insert demo order");
    await db.insert(schema.orderItems).values(
      seed.items.map((it) => ({
        orderId: order.id,
        productId: it.product.id,
        quantity: it.qty,
        unitPriceCents: it.product.priceCents,
      })),
    );
  }
  // eslint-disable-next-line no-console
  console.log(`  ✓ inserted ${orderSeeds.length} demo orders`);
}

async function seedSettings() {
  await db
    .insert(schema.settings)
    .values({
      key: "business",
      value: {
        name: "Fouzia's Kitchen",
        phone: "(416) 894-5755",
        email: "hello@fouziaskitchen.com",
        instagram: "https://www.instagram.com/fouzias.kitchen",
        whatsapp: "https://wa.me/14168945755",
        serviceArea: "Greater Toronto Area",
        deliveryFlatFeeCents: 800,
        defaultDailyCapacity: 5,
      },
    })
    .onConflictDoNothing();
  // eslint-disable-next-line no-console
  console.log("  ✓ business settings seeded");
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("🌱 Fouzia's Kitchen — database seed\n");
  await seedProducts();
  await seedSettings();
  await seedDemoData();
  // eslint-disable-next-line no-console
  console.log("\n✅ Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
