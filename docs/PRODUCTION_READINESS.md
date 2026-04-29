# Production Readiness Checklist

> Living document. Anything that must be wired, configured, or verified
> before flipping `main` from the static site to the new Next.js app —
> and anything that must keep working once it is.
>
> Last updated: 2026-04-28 — after commit 5 (admin shell + dashboard).

---

## Status legend
- 🔴 **Blocker** — production cannot launch without this
- 🟡 **Required for full feature** — non-blocking for cutover, but a feature is broken without it
- 🟢 **Nice-to-have / hardening** — improves the deploy but not strictly needed
- ✅ **Done**

---

## 1 · Vercel project

| Item | Status | Notes |
|---|---|---|
| Framework preset = **Next.js** | ✅ | Was "Other" — flipped during commit 5 |
| Root Directory = `./` | ✅ | |
| Build Command = default (`next build`) | ✅ | |
| Output Directory = default (`.next`) | ✅ | |
| Install Command = default (`npm install`) | ✅ | |
| Node version pinned to 20.x | ✅ | `.nvmrc` + `engines.node` in `package.json` |
| Switch from `npm` → `pnpm` (commit `pnpm-lock.yaml`) | 🟢 | Faster installs; not required |
| **Remove `SKIP_ENV_VALIDATION=1`** from Production env | 🔴 | Currently set in Preview only — never set it in Production |
| Deployment Protection: enabled for Preview, disabled for Production | 🟢 | |
| Custom domain (e.g. `fouziaskitchen.com`) added + verified | 🔴 | Settings → Domains |
| HTTPS / auto-cert on custom domain | 🔴 | Vercel handles automatically once DNS resolves |

### Environment variables — Production scope

Add these in **Settings → Environment Variables → Production**:

| Var | Required | Where it comes from |
|---|---|---|
| `DATABASE_URL` | 🔴 | Neon → project → Connection string (with `?sslmode=require`) |
| `AUTH_SECRET` | 🔴 | Run locally: `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | 🔴 | Set to `true` (required behind Vercel's proxy) |
| `OWNER_EMAIL` | 🔴 | Comma-separated allowlist of owner email(s). Only these can sign in to `/admin`. |
| `SITE_URL` | 🔴 | The canonical production URL, e.g. `https://fouziaskitchen.com` |
| `RESEND_API_KEY` | 🔴 | Resend dashboard → API Keys |
| `EMAIL_FROM` | 🔴 | e.g. `Fouzia's Kitchen <hello@fouziaskitchen.com>` (must be a verified sender) |
| `STRIPE_SECRET_KEY` | 🟡 | Stripe → Developers → API keys (live mode for prod) |
| `STRIPE_WEBHOOK_SECRET` | 🟡 | Created when you add the webhook endpoint (see §4) |
| `STRIPE_TAX_ENABLED` | 🟢 | `true` if you've enabled Stripe Tax in your account |
| `UPSTASH_REDIS_REST_URL` | 🟢 | Only if you enable inquiry-form rate limiting (Upstash → Redis → REST) |
| `UPSTASH_REDIS_REST_TOKEN` | 🟢 | Same as above |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🟡 | Public key — only needed if we ship Stripe Elements (we currently use redirect Checkout) |

Repeat the same vars for **Preview** if you want previews to be functional end-to-end (recommended; can use Stripe **test** keys + a separate Neon branch).

---

## 2 · Database (Neon Postgres)

| Item | Status | Notes |
|---|---|---|
| Neon project created | 🔴 | https://neon.tech — free tier is fine to start |
| Production branch DB created | 🔴 | Use Neon "branch" feature for isolated preview DBs |
| `DATABASE_URL` connection string saved into Vercel | 🔴 | Must include `?sslmode=require` |
| Run initial schema migration | 🔴 | `npm run db:push` (drizzle-kit push) — see §8 walkthrough |
| Seed real products + business settings | 🔴 | `npm run db:seed` — idempotent on slugs, safe to re-run |
| (Optional) seed demo orders | 🟢 | Auto-skipped by `seed.ts` when orders table is non-empty |
| Connection pooling configured | 🟢 | Neon's pooled endpoint URL — better for serverless |
| Backups enabled | 🟢 | Neon paid plans include PITR |

---

## 3 · Auth + Email (Resend)

| Item | Status | Notes |
|---|---|---|
| Resend account created | 🔴 | https://resend.com |
| Sending domain added + verified (DNS records) | 🔴 | e.g. `mail.fouziaskitchen.com` — SPF + DKIM + DMARC |
| API key generated | 🔴 | Resend → API Keys |
| `EMAIL_FROM` matches a verified address on that domain | 🔴 | |
| Magic-link email template tested | 🟡 | `src/lib/email.ts` `renderMagicLinkEmail()` — send to yourself first |
| Owner email(s) added to `OWNER_EMAIL` allowlist | 🔴 | Anyone not on this list cannot sign in even with a valid magic link |
| Test sign-in flow against production URL | 🔴 | See §8 walkthrough |
| Add fallback contact email if Resend is rate-limited | 🟢 | |

---

## 4 · Stripe (payments)

> Status: **scaffolded in DB schema, not yet implemented.** Lands in commit 8.
> Listed here so we don't forget the operator-side setup.

| Item | Status | Notes |
|---|---|---|
| Stripe account created + verified for CAD | 🔴 (when commit 8 lands) | https://stripe.com — business profile, bank account, ID verification |
| Activate live mode | 🔴 | Required to take real money |
| **Test mode** keys saved to **Preview** env | 🟡 | `STRIPE_SECRET_KEY` (sk_test_…), `STRIPE_WEBHOOK_SECRET` (whsec_…) |
| **Live mode** keys saved to **Production** env | 🔴 | `STRIPE_SECRET_KEY` (sk_live_…), `STRIPE_WEBHOOK_SECRET` (whsec_…) |
| Webhook endpoint added in Stripe Dashboard | 🔴 | URL: `https://<your-domain>/api/stripe/webhook`, events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` |
| Statement descriptor configured | 🟢 | "FOUZIA'S KITCHEN" — what shows on customer card statements |
| Receipts enabled (Stripe sends them) | 🟢 | Settings → Customer emails → "Successful payments" |
| Stripe Tax configured (if collecting GST/HST) | 🟢 | Settings → Tax → Add registration for Canada |
| Refund policy URL set | 🟢 | Shown in Checkout |
| Test a real $1 transaction in **live** mode end-to-end | 🔴 | Then refund it. Confirms keys + webhook + DB sync work. |

---

## 5 · DNS / Domain

| Item | Status | Notes |
|---|---|---|
| Domain registered | 🔴 | If not already |
| `A` / `CNAME` records pointing to Vercel | 🔴 | Vercel will show the exact records once you add the domain |
| `www` → apex redirect (or vice-versa) chosen | 🟢 | Pick canonical and 308 the other |
| Resend DNS records (SPF, DKIM, DMARC) added | 🔴 | See §3 |

---

## 6 · Content & legal

| Item | Status | Notes |
|---|---|---|
| Privacy Policy page | 🔴 | Required by Stripe + good practice; can be `/privacy` route |
| Terms of Service page | 🟡 | Especially if taking deposits |
| Refunds & Cancellation Policy page | 🔴 | Required by Stripe Checkout for non-shipping merchants |
| Contact info accurate site-wide | ✅ | Phone (416) 894-5755, IG @fouzias.kitchen |
| OG image (`/assets/og-image.jpg`) replaced with branded artwork | 🟢 | Currently a placeholder reference |
| Favicon set | 🟡 | Currently `/assets/logo.svg` — generate a `.ico` + Apple touch icons |
| Sitemap (`/sitemap.xml`) generated | 🟢 | Add `app/sitemap.ts` once routes settle |
| `robots.txt` allows crawling of marketing routes only | 🟢 | Block `/admin`, `/api` |

---

## 7 · Operational hardening

| Item | Status | Notes |
|---|---|---|
| Sentry (or similar) error reporting wired | 🟢 | CSP already allowlists `*.ingest.sentry.io` |
| Vercel Analytics enabled | 🟢 | Free tier; one-line install |
| Vercel Web Vitals enabled | 🟢 | |
| Backups: Neon PITR + a weekly logical dump | 🟢 | `pg_dump` to S3 / R2 |
| Audit log retention plan | 🟢 | DB row growth is fine for years; revisit at 1M+ events |
| Owner runbook (how to refund, cancel, edit an order) | 🟡 | Lands as `docs/OPERATIONS.md` in commit 9 |
| `/admin` access reviewed quarterly | 🟢 | Calendar reminder: re-check `OWNER_EMAIL` allowlist |
| `AUTH_SECRET` rotation procedure documented | 🟢 | Rotating invalidates all sessions — owner must re-sign in |

---

## 8 · Walkthroughs

> These will be expanded once we're closer to launch. For now, this section
> captures the sequence so nothing gets forgotten.

### 8.1 First-time deploy (preview → production)

```
1.  Provision Neon DB
    → neon.tech → New project → copy pooled connection string

2.  Provision Resend
    → resend.com → Add domain → add the DNS records they show
    → wait for verification (usually <10 min)
    → API Keys → Create

3.  Generate AUTH_SECRET locally
    $ openssl rand -base64 32

4.  Add env vars to Vercel (Production scope)
    → Settings → Environment Variables → all of §1's "required" rows

5.  Push schema + seed real data (run from your laptop, not Vercel)
    $ DATABASE_URL='<prod url>' npm run db:push
    $ DATABASE_URL='<prod url>' npm run db:seed

6.  Add custom domain in Vercel
    → Settings → Domains → add your domain → copy DNS records → set them at registrar

7.  Merge feature/owner-hub → main
    → Vercel auto-deploys to production

8.  Smoke test (in this exact order)
    a. Visit / — marketing site loads, cart drawer works
    b. Submit an inquiry — confirm row in DB (admin → inquiries)
    c. Visit /admin — redirects to /admin/login
    d. Enter your owner email — receive magic link from Resend
    e. Click link — lands on dashboard, your stats render
    f. (Once Stripe ships) place a $1 test order, confirm webhook updates payment_status
```

### 8.2 Stripe wiring (when commit 8 lands)

To be added.

### 8.3 Owner training

To be added — short video + cheat sheet.

---

## 9 · Removed / TODO

Things deliberately deferred:

- **`pnpm` migration** — currently using `npm` on Vercel because no lockfile is committed. Switch when convenient.
- **Image optimization for product photos** — currently raw `<img>` tags inside the marketing HTML. Will move to `next/image` when we redesign the menu section.
- **i18n (Dari / Pashto)** — out of scope for v1.
- **Customer accounts / order history** — only owner side has accounts; customers transact via email + checkout link.
- **SMS notifications** — Twilio/Resend SMS could be added later for "your order is ready" pings.
