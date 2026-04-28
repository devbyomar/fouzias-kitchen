/**
 * Drizzle schema — single source of truth for the Postgres database.
 *
 * Conventions:
 * - All money is stored as INTEGER cents (CAD). Never floats.
 * - All timestamps are TIMESTAMPTZ, defaulted to now() server-side.
 * - All ids are text (cuid2-style) generated in app code via `createId()`.
 * - Soft-delete is intentionally NOT used; we audit-log destructive ops instead.
 * - Auth.js tables (users, accounts, sessions, verificationTokens) follow the
 *   shape required by @auth/drizzle-adapter.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@/lib/ids";

/* ============================================================
   ENUMS
   ============================================================ */

export const userRoleEnum = pgEnum("user_role", ["owner", "staff"]);

export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "confirmed",
  "in_prep",
  "ready",
  "fulfilled",
  "cancelled",
]);

export const fulfillmentTypeEnum = pgEnum("fulfillment_type", ["pickup", "delivery"]);

export const orderSourceEnum = pgEnum("order_source", ["web", "manual", "inquiry"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "pending",
  "paid",
  "refunded",
  "failed",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", ["new", "responded", "archived"]);

/* ============================================================
   AUTH.JS TABLES (drizzle-adapter shape)
   ============================================================ */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

/* ============================================================
   DOMAIN: CUSTOMERS
   ============================================================ */

export const customers = pgTable(
  "customer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 254 }),
    tags: text("tags").array().notNull().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    phoneIdx: index("customer_phone_idx").on(t.phone),
    emailIdx: index("customer_email_idx").on(t.email),
  }),
);

/* ============================================================
   DOMAIN: PRODUCTS & INVENTORY
   ============================================================ */

export const products = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    nameEn: text("name_en").notNull(),
    nameTraditional: text("name_traditional"),
    subtitle: text("subtitle"),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    unitLabel: varchar("unit_label", { length: 40 }), // "per dozen", "per 200g"
    photoUrl: text("photo_url"),
    leadTimeDays: integer("lead_time_days").notNull().default(3),
    minQty: integer("min_qty").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    allowsInstantCheckout: boolean("allows_instant_checkout").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    activeSortIdx: index("product_active_sort_idx").on(t.active, t.sortOrder),
  }),
);

export const inventory = pgTable(
  "inventory",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: false, mode: "date" }).notNull(), // calendar date
    quantityAvailable: integer("quantity_available").notNull(),
    soldOut: boolean("sold_out").notNull().default(false),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.date] }),
  }),
);

export const inventoryHolds = pgTable(
  "inventory_hold",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: false, mode: "date" }).notNull(),
    quantity: integer("quantity").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    expiresIdx: index("hold_expires_idx").on(t.expiresAt),
    productDateIdx: index("hold_product_date_idx").on(t.productId, t.date),
    orderIdx: index("hold_order_idx").on(t.orderId),
  }),
);

export const dayCapacity = pgTable("day_capacity", {
  date: timestamp("date", { withTimezone: false, mode: "date" }).primaryKey(),
  maxOrders: integer("max_orders").notNull().default(99),
  blocked: boolean("blocked").notNull().default(false),
  blockReason: text("block_reason"),
});

/* ============================================================
   DOMAIN: ORDERS
   ============================================================ */

export const orders = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    /** Short, human-friendly number for emails/UI ("#1042"). */
    number: integer("number").notNull().generatedAlwaysAsIdentity({ startWith: 1000 }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("new"),
    fulfillmentType: fulfillmentTypeEnum("fulfillment_type").notNull(),
    requestedDate: timestamp("requested_date", { withTimezone: false, mode: "date" }).notNull(),
    requestedTime: varchar("requested_time", { length: 16 }),
    address: jsonb("address"), // { line1, line2?, city, postal, instructions? }
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    notes: text("notes"),
    source: orderSourceEnum("source").notNull().default("web"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    refundedCents: integer("refunded_cents").notNull().default(0),
    cardBrand: varchar("card_brand", { length: 32 }),
    cardLast4: varchar("card_last4", { length: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    numberIdx: uniqueIndex("order_number_idx").on(t.number),
    customerIdx: index("order_customer_idx").on(t.customerId),
    statusIdx: index("order_status_idx").on(t.status),
    paymentStatusIdx: index("order_payment_status_idx").on(t.paymentStatus),
    requestedDateIdx: index("order_requested_date_idx").on(t.requestedDate),
    stripeSessionIdx: index("order_stripe_session_idx").on(t.stripeSessionId),
    createdAtIdx: index("order_created_at_idx").on(t.createdAt),
  }),
);

export const orderItems = pgTable(
  "order_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineNotes: text("line_notes"),
  },
  (t) => ({
    orderIdx: index("order_item_order_idx").on(t.orderId),
  }),
);

export const statusEvents = pgTable(
  "status_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("status_event_order_idx").on(t.orderId),
  }),
);

/* ============================================================
   DOMAIN: INQUIRIES
   ============================================================ */

export const inquiries = pgTable(
  "inquiry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    rawName: text("raw_name").notNull(),
    rawPhone: varchar("raw_phone", { length: 40 }),
    rawEmail: varchar("raw_email", { length: 254 }).notNull(),
    rawDate: varchar("raw_date", { length: 80 }), // free-text "next Saturday" etc.
    message: text("message").notNull(),
    status: inquiryStatusEnum("status").notNull().default("new"),
    convertedOrderId: text("converted_order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("inquiry_status_idx").on(t.status),
    createdAtIdx: index("inquiry_created_at_idx").on(t.createdAt),
  }),
);

/* ============================================================
   DOMAIN: WEBHOOKS & AUDIT
   ============================================================ */

export const webhookEvents = pgTable(
  "webhook_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    provider: varchar("provider", { length: 32 }).notNull(), // "stripe"
    eventId: text("event_id").notNull(), // provider's event id
    type: text("type").notNull(),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
  },
  (t) => ({
    providerEventIdx: uniqueIndex("webhook_provider_event_idx").on(t.provider, t.eventId),
  }),
);

export const auditLogs = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    entity: varchar("entity", { length: 64 }).notNull(),
    entityId: text("entity_id").notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    diff: jsonb("diff"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index("audit_entity_idx").on(t.entity, t.entityId),
    actorIdx: index("audit_actor_idx").on(t.actorId),
    createdAtIdx: index("audit_created_at_idx").on(t.createdAt),
  }),
);

/* ============================================================
   DOMAIN: SETTINGS (single-row key-value)
   ============================================================ */

export const settings = pgTable("setting", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   RELATIONS
   ============================================================ */

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  inquiries: many(inquiries),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inventory: many(inventory),
  orderItems: many(orderItems),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  statusEvents: many(statusEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  customer: one(customers, { fields: [inquiries.customerId], references: [customers.id] }),
  convertedOrder: one(orders, {
    fields: [inquiries.convertedOrderId],
    references: [orders.id],
  }),
}));

/* ============================================================
   TYPE EXPORTS
   ============================================================ */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
export type StatusEvent = typeof statusEvents.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
