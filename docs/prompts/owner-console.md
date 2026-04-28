# 🧑‍🍳 PROMPT: Build the Owner Console for Fouzia's Kitchen

---

## 1. Your Role

You are a **Principal Full-Stack Engineer and Product Architect**. You have shipped multiple commerce products end-to-end and you specialize in **operator-first internal tools** — the kind of dashboards that small business owners actually open every morning instead of avoiding. You write production-quality, accessible, well-documented code and you make confident architectural decisions without asking the user 20 clarifying questions.

You are now the master architect of the **Fouzia's Kitchen** repository. Treat this as your codebase.

## 2. Repository Context (Ground Truth)

**Repo:** `devbyomar/fouzias-kitchen` (currently on branch `contact-info-update`)
**Stack today:** Pure static site — `index.html`, `styles.css`, `script.js`, `assets/`. No build step. Served locally via `python3 -m http.server 5173`. Planned deployment target: **Vercel**.

**What the customer-facing site already does:**
- Premium Afghan home-bakery brand site (Fouzia's Kitchen, Greater Toronto Area).
- 6 products with real prices, cart persisted in `localStorage` under key `fouziaCart.v1` (see `script.js` → `PRODUCTS` catalog and `Cart` module).
- Inquiry/checkout form that **does not actually submit anywhere yet** — it validates client-side, appends a human-readable order summary to the message body, and shows a success state. No backend, no email, no order record.
- Contact: phone `(416) 894-5755`, Instagram `@fouzias.kitchen`, WhatsApp at the same number. Owner is **Fouzia**, a solo operator baking from home.

**What does NOT exist yet:**
- Any backend, database, auth, or persistence beyond `localStorage`.
- Any concept of an "order" as a server-side record.
- Any admin/owner surface.

## 3. Your Mission

Design and build the **Owner Console** — a single, password-protected web interface at route `/admin` that is Fouzia's **one-stop cockpit** for running the bakery. She should be able to open it on her phone in the morning and run her entire day from it.

You must own the product decisions. The user explicitly said: *"I am not too sure of all the features, you as the professional architect figure it out."* So **make the call**, justify briefly, and ship.

## 4. Non-Negotiable Constraints

1. **Mobile-first.** Fouzia will use this on an iPhone in the kitchen with floury hands. Big tap targets, one-handed reach, no hover-only affordances.
2. **Brand-consistent.** Match the existing typography (Cormorant Garamond + Inter), color palette, and "warm magazine" aesthetic from `styles.css`. The console should feel like the same product, not a bootstrap admin theme.
3. **Auth required.** No "anyone with the URL" admin. Use a real auth pattern (see §5).
4. **Real persistence.** No `localStorage`-only fakery for the admin side. Orders, customers, and inventory must live in a real database that survives a redeploy.
5. **Vercel-deployable** with zero manual server management. Pick a stack that fits Vercel's free/hobby tier comfortably.
6. **Backwards-compatible.** The existing customer site (`index.html` cart + inquiry form) must continue to work. The inquiry form must now actually create an `Order` record server-side instead of being a no-op.
7. **Accessible.** WCAG 2.1 AA. Keyboard navigable. Proper ARIA. Respect `prefers-reduced-motion`.
8. **No secrets in the repo.** Use environment variables; document them in `.env.example`.

## 5. Recommended Architecture (you may deviate with justification)

- **Migrate the project to Next.js 15 (App Router) + TypeScript** in-place. Move the existing static site into the `app/` route structure as the marketing site (`/`), preserving every existing visual and behavior. This is the cleanest path to add `/admin`, API routes, and auth without bolting on a separate service.
- **Database:** Postgres via **Neon** or **Supabase** (both have generous free tiers and Vercel-native integrations). Use **Drizzle ORM** with migrations checked into the repo.
- **Auth:** **Auth.js (NextAuth v5)** with **email magic-link** provider via Resend, plus a single hardcoded allowlisted email for Fouzia (env var `OWNER_EMAIL`). No public sign-up — admin is invite-only by allowlist.
- **Email:** **Resend** for both magic links and customer order notifications.
- **File storage** (for product photos / order attachments): **Vercel Blob** or **Supabase Storage**.
- **UI primitives:** Hand-rolled components in the existing CSS system. If you reach for a library, use **Radix UI primitives** (unstyled) so the brand styling stays intact. Do NOT pull in shadcn wholesale — it will fight the existing aesthetic.
- **Charts:** **Recharts** (small, composable, themeable).
- **Forms & validation:** **react-hook-form** + **zod**. Share zod schemas between client and server (API routes).
- **State:** Server components by default; **TanStack Query** only where you need optimistic updates (e.g., toggling order status).
- **Testing:** **Vitest** for unit/logic, **Playwright** for one happy-path admin E2E (login → view order → mark fulfilled).

If you choose a different stack, you must justify it in 2 sentences in the README and still satisfy every constraint above.

## 6. Feature Spec — The Owner Console

Build all of the following. Each is a real, working feature, not a stub.

### 6.1 Dashboard (`/admin`) — "Today at a glance"
- **Today's orders** count + revenue, with trend arrows vs. yesterday and vs. same weekday last week.
- **Upcoming pickups/deliveries** for the next 7 days, grouped by date, with customer name, items, and a one-tap "Mark ready" / "Mark fulfilled" button.
- **Action queue:** new inquiries awaiting response, orders with no confirmed pickup time, low-stock ingredients (see §6.5).
- **Revenue this week / month** sparkline.
- **Top product this month.**

### 6.2 Orders (`/admin/orders`)
- List view: filterable by status (`new`, `confirmed`, `in_prep`, `ready`, `fulfilled`, `cancelled`), date range, fulfillment type (pickup/delivery), and free-text search across customer name/phone/email.
- Each row: customer, items summary, total, requested date, status pill, quick-actions menu.
- Detail view (`/admin/orders/[id]`): full customer info, itemized order with quantities and per-line + total pricing, internal notes (markdown), status timeline (who changed what when), buttons to email/SMS/WhatsApp the customer (deep links), and a "Print packing slip" view (`?print=1`) that's print-stylesheet optimized.
- **Manual order creation** — Fouzia takes orders by phone constantly. She must be able to add an order from scratch in <30 seconds.
- Status changes trigger an automated customer email via Resend (templated, brand-styled).

### 6.3 Inquiries (`/admin/inquiries`)
- The existing public inquiry form now POSTs to `/api/inquiries`, creating an `Inquiry` record.
- List + detail view, ability to **convert an inquiry into an order** with one click (pre-fills the order form).
- Mark as `responded` / `archived`.

### 6.4 Customers (`/admin/customers`)
- Auto-populated from orders + inquiries (dedupe by phone, then email).
- Profile: contact info, lifetime order count + spend, last order date, notes ("allergic to pistachio", "prefers Saturday pickup", "Fatima's mother — VIP").
- Tag system (`vip`, `wholesale`, `family`, custom).
- One-click "New order for this customer."

### 6.5 Products & Inventory (`/admin/products`)
- CRUD for the product catalog. **Source of truth moves from `script.js`'s hardcoded `PRODUCTS` to the database.** The public site fetches the catalog at build time (ISR, 60s revalidate) so it stays fast.
- Per product: name (English + traditional Afghan name), subtitle, description, price, photo, lead time, minimum order quantity, active/inactive toggle, sort order.
- **Lightweight inventory:** for each product, an optional "available quantity for the next N days" with a "sold out until [date]" toggle. The public site respects this — sold-out items render disabled with a "Notify me" capture.

### 6.6 Calendar (`/admin/calendar`)
- Month + week views of all confirmed orders by pickup/delivery date.
- **Capacity limits:** Fouzia sets a daily cap (e.g., "max 3 large orders per Saturday"). The public site's date picker disables full days.
- Block out vacation days; the public inquiry form respects blocked dates.

### 6.7 Analytics (`/admin/analytics`)
- Revenue by day/week/month with Recharts line chart.
- Product mix (pie/bar) — what's selling.
- Repeat customer rate.
- Average order value.
- Conversion: inquiries → orders.
- All exportable as CSV.

### 6.8 Settings (`/admin/settings`)
- Business info (name, phone, email, service area, hours).
- Notification preferences (which events trigger emails to Fouzia).
- Email template editor (subject + body with `{{variables}}`) for: order received, order confirmed, order ready, order fulfilled.
- Manage allowlisted admin emails.

### 6.9 Cross-cutting
- **Global command palette** (`Cmd/Ctrl+K`): jump to any order, customer, product; trigger "new order" / "new inquiry" actions.
- **Audit log** (`/admin/audit`): every mutation recorded with actor, timestamp, before/after diff.
- **Dark mode** that respects `prefers-color-scheme` (Fouzia bakes early; her phone is on auto-dark at 5am).
- **PWA manifest + installable** so she can add it to her iPhone home screen.
- **Empty states** with helpful illustrations/copy, never blank screens.
- **Error boundaries** with friendly messaging and a "copy error details" button.

### 6.10 Payments (Stripe) — Standard Catalog Checkout

The site has **two parallel purchase flows** and they must not be conflated:

| Flow | Trigger | Path |
|---|---|---|
| **Inquiry** (existing) | Cart contains any custom/platter item, OR customer explicitly chooses "Request a quote" | `POST /api/inquiries` → owner replies manually |
| **Order & Pay** (new) | Cart contains only standard catalog items AND customer chooses "Checkout" | `POST /api/checkout` → Stripe Checkout → webhook |

The cart UI is shared. The checkout button at the bottom of the cart drawer dynamically reads "Checkout" or "Request a quote" based on cart contents and a per-product `allowsInstantCheckout: boolean` flag.

#### 6.10.1 Processor & integration mode
- **Stripe Checkout (hosted, redirect mode).** Not Elements. We want PCI-DSS SAQ-A scope, not SAQ-A-EP.
- Currency: **CAD**. Supports Apple Pay, Google Pay, and card by default. Enable Link.
- Use `mode: 'payment'` (one-time), `automatic_tax: { enabled: true }` once Stripe Tax is configured for Ontario, otherwise tax is computed in our own code and passed as a line item until HST registration is in place.

#### 6.10.2 Server-side price authority — non-negotiable
The browser sends `{ items: [{ productId, quantity, lineNotes? }], fulfillmentType, requestedDate, deliveryAddress? }`. **Never** a price, **never** a total. The `/api/checkout` handler:

1. Re-fetches each `Product` from the DB and confirms `active === true` and `allowsInstantCheckout === true`.
2. Validates `quantity >= product.minQty` and `quantity <= inventory.quantityAvailable` for `requestedDate`.
3. Validates `requestedDate` is not blocked, not past today + `max(leadTimeDays)`, and `DayCapacity` for that date is not full.
4. Computes `subtotalCents`, `deliveryFeeCents` (flat fee from settings if delivery), `taxCents`, `totalCents` server-side.
5. Creates an `Order` row with `paymentStatus: 'pending'`, `status: 'new'`, `source: 'web'`.
6. Calls `stripe.checkout.sessions.create(...)` with:
   - `line_items` built from the validated DB prices.
   - `metadata: { orderId }` and `client_reference_id: orderId`.
   - `success_url: ${SITE_URL}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url: ${SITE_URL}/cart?cancelled=1`
   - `customer_email` prefilled if the customer is recognized.
   - `phone_number_collection: { enabled: true }`
   - `shipping_address_collection` only when `fulfillmentType === 'delivery'`.
   - **Idempotency key = the `orderId`** so a double-click doesn't double-charge.
7. Returns `{ url }` and the browser does `window.location = url`.

If any validation fails, return a typed `409` with a human message ("That date just filled up — please pick another") and **do not** create the Stripe session.

#### 6.10.3 Webhooks are the source of truth
Implement `POST /api/webhooks/stripe` as a **Node runtime** route (not Edge — we need the raw body):

- Read raw body via `await req.text()` BEFORE any parsing.
- Verify with `stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)`. Reject on failure with `400`.
- Handle at minimum:
  - `checkout.session.completed` → mark order `paymentStatus: 'paid'`, decrement `Inventory`, increment `DayCapacity` usage, send customer confirmation email + owner new-order notification, store `stripePaymentIntentId` and `last4`/`brand` from the payment method.
  - `checkout.session.expired` / `checkout.session.async_payment_failed` → mark order `cancelled` and release the inventory/capacity hold.
  - `charge.refunded` → update `Order.refundedCents` and `paymentStatus: 'refunded'`; log to audit; email customer.
  - `payment_intent.payment_failed` → log, notify owner if amount > $0.
- **Idempotency:** persist every processed `event.id` in a `WebhookEvent` table; on duplicate, return `200` immediately without reprocessing. Stripe retries aggressively.
- Always return `200` within ~5 seconds. Push slow work (emails, etc.) to a background task or `after()` in Next.js 15.

#### 6.10.4 Inventory holds & the race condition
Two customers might check out the last available slot at the same time. The fix:

- At session creation, write a row to `InventoryHold (orderId, productId, date, quantity, expiresAt = now + 30min)`.
- `Inventory.available(productId, date)` is computed as `quantityAvailable - sum(confirmed orders) - sum(active holds)`.
- A nightly cron (Vercel Cron) sweeps:
  - Holds older than 30 min → released.
  - Orders in `pending` for > 1 hour with no successful webhook → `cancelled`, holds released.

#### 6.10.5 Refunds (admin-side)
On `/admin/orders/[id]`:
- "Refund" button visible only when `paymentStatus === 'paid'`.
- Modal supports full or partial refund (with reason text, required).
- Calls `stripe.refunds.create({ payment_intent, amount, reason, metadata: { actorId, internalReason } })`.
- Optimistically updates UI; webhook confirms.
- Every refund writes an `AuditLog` row.

#### 6.10.6 Customer-facing pages
- `/cart` — existing drawer, plus a full-page route for direct linking.
- `/checkout/details` — pre-Stripe step: pickup vs delivery, requested date (calendar respects `DayCapacity` + `Inventory`), notes, contact info if not signed in.
- `/order/confirmed?session_id=…` — fetch the order by session id, show a warm thank-you with order number, pickup details, what to expect next. Resilient to the webhook not having fired yet (poll up to 10s, then show "We're processing your payment — you'll get an email shortly").
- `/order/[id]` — public order status page accessible via a signed token in the confirmation email (no auth required, but unguessable).
- `/policies/refunds` and `/policies/privacy` — linked from the footer and from Stripe Checkout's "Terms" field.

#### 6.10.7 Security checklist (do all of these)
1. Webhook signature verification with raw body. **Test it by sending a forged request and confirming 400.**
2. Secrets only in env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Use Stripe **restricted API keys** in production (scoped to Checkout Sessions write + Refunds write only).
4. CSP allowlists `https://js.stripe.com` and `https://checkout.stripe.com`. HSTS on. HTTPS-only cookies.
5. Rate-limit `/api/checkout` (e.g., 10/min/IP via Upstash Ratelimit).
6. Never log full Stripe request/response bodies — they may contain PII. Log `session.id` and `payment_intent.id` only.
7. Never store PAN, CVV, or full card data. Only `brand` + `last4` for display.
8. Re-check inventory + capacity inside the webhook, not just at session creation. If the second customer somehow paid for the last slot, auto-refund and email an apology.
9. Use Stripe Radar's default rules at minimum; tune after first 50 transactions.
10. Test card matrix: `4242…4242` (success), `4000…0002` (decline), `4000…9995` (insufficient funds), `4000 0027 6000 3184` (3DS challenge). Document in `docs/PAYMENTS_TESTING.md`.

#### 6.10.8 Local development
- `stripe login` then `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — copy the `whsec_…` it prints into `.env.local`.
- Provide a `pnpm dev:stripe` script that runs Next dev + the Stripe CLI listener concurrently.

#### 6.10.9 Tax & legal
- Default to **HST not collected** with a footer note "Prices include applicable taxes" until HST registration is complete (revenue threshold: $30k CAD over 4 rolling quarters).
- Once registered, flip `STRIPE_TAX_ENABLED=true` in env and let Stripe Tax compute. Save the registration number in Settings.
- Refund + cancellation policy and privacy policy are required at launch (linked from Stripe Checkout's branding settings and the site footer).

## 7. Data Model (starting point — extend as needed)

~~~text
User        (id, email, role: 'owner'|'staff', createdAt)
Customer    (id, name, phone, email, tags[], notes, createdAt)
Product     (id, slug, nameEn, nameTraditional, subtitle, description,
             priceCents, photoUrl, leadTimeDays, minQty, sortOrder,
             active, allowsInstantCheckout)
Inventory   (productId, date, quantityAvailable, soldOut)
InventoryHold (id, orderId, productId, date, quantity, expiresAt)
DayCapacity (date, maxOrders, blocked, blockReason)
Order       (id, customerId, status, fulfillmentType: 'pickup'|'delivery',
             requestedDate, requestedTime, address?, subtotalCents,
             deliveryFeeCents, taxCents, totalCents, notes,
             source: 'web'|'manual'|'inquiry',
             paymentStatus: 'unpaid'|'pending'|'paid'|'refunded'|'failed',
             stripeSessionId?, stripePaymentIntentId?,
             amountPaidCents, refundedCents, cardBrand?, cardLast4?,
             createdAt, updatedAt)
OrderItem   (id, orderId, productId, quantity, unitPriceCents, lineNotes)
StatusEvent (id, orderId, fromStatus, toStatus, actorId, note, createdAt)
Inquiry     (id, customerId?, rawName, rawPhone, rawEmail, message,
             status: 'new'|'responded'|'archived', convertedOrderId?, createdAt)
WebhookEvent (id, provider, eventId UNIQUE, type, receivedAt, processedAt)
AuditLog    (id, actorId, entity, entityId, action, diff, createdAt)
~~~

## 8. Deliverables

1. **Migration plan** as the first message of your response — a numbered list of the steps you will take to convert the static site into the Next.js app without breaking the live customer experience. Call out anything destructive.
2. **Full implementation** — all files created/modified. Use proper file-creation tools, not code blocks dumped in chat.
3. **`.env.example`** with every required variable documented inline.
4. **`README.md`** rewritten to cover: local dev, env setup, database migration commands, deploying to Vercel, creating the first owner account.
5. **`docs/ARCHITECTURE.md`** — 1-page diagram-in-prose explaining request flow, auth, and data model decisions.
6. **Seed script** (`pnpm db:seed`) that populates the 6 existing products and 3 fake orders so the dashboard isn't empty on first run.
7. **Two Playwright E2Es** proving critical paths: (a) admin login → view order → mark fulfilled, and (b) customer adds standard item to cart → checkout via Stripe test card → lands on confirmation → order appears as `paid` in admin.
8. **`docs/PAYMENTS_TESTING.md`** — Stripe test card matrix, how to run the local webhook listener, how to simulate refunds.
9. **A new git branch** `feat/owner-console` with logically-grouped commits (not one mega-commit). Push it and print the PR URL at the end.

## 9. Quality Bar

- Type-safe end to end. No `any`. No `// @ts-ignore`.
- Every API route validates input with zod and returns typed errors.
- Every mutation goes through a server action or API route that re-checks auth + ownership.
- Lighthouse: marketing site stays ≥95 on Performance/Accessibility/SEO. Admin ≥90 on Accessibility.
- All copy is warm, plain-English, owner-friendly. Never say "Entity 404" — say "We couldn't find that order."

## 10. What to do right now

1. Acknowledge the mission in 2 sentences.
2. Print the migration plan from §8.1.
3. Ask **at most 3 clarifying questions** — only ones that genuinely block you. For everything else, decide and proceed.
4. Then start building.

Begin.
