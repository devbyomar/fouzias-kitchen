# Fouzia's Kitchen

> Premium Afghan home bakery serving the Greater Toronto Area.
> Marketing site, customer checkout, and owner console — one Next.js app.

[![Stack](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Stack](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Stack](https://img.shields.io/badge/TypeScript-5.7-3178c6)](https://www.typescriptlang.org)
[![Stack](https://img.shields.io/badge/Postgres-Neon-336791)](https://neon.tech)
[![Stack](https://img.shields.io/badge/Stripe-Checkout-635bff)](https://stripe.com)

---

## What this is

A single Next.js 15 application serving three audiences:

| Surface | Path | Audience |
|---|---|---|
| **Marketing site** | `/` | Customers browsing the menu |
| **Customer checkout** | `/cart`, `/checkout/details`, `/order/*` | Customers placing & paying for orders |
| **Owner console** | `/admin/*` | Fouzia (the owner), managing orders, inventory, customers, analytics |

The owner console is invite-only — access is gated by a magic-link sent only to email addresses on the `OWNER_EMAIL` allowlist.

## Tech stack

- **Next.js 15** (App Router, React 19, Server Components first)
- **TypeScript** strict mode, no `any`
- **Drizzle ORM** + **Neon Postgres** (any Postgres works)
- **NextAuth v5** with Resend email provider (magic links)
- **Stripe Checkout** (hosted, redirect mode — PCI-DSS SAQ-A scope)
- **Resend** for transactional email
- **Vercel Blob** for product images
- **Recharts** for analytics
- **Radix UI** primitives + hand-rolled CSS in the bakery's brand voice
- **Vitest** + **Playwright** for tests

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the request flow, auth model, and key trade-offs.

## Local development

### Prerequisites

- Node `>=20.11` (use `nvm use` — see `.nvmrc`)
- pnpm `>=9` — install with `corepack enable` then `corepack prepare pnpm@latest --activate`
- A Postgres database (free [Neon](https://neon.tech) project works perfectly)
- A [Resend](https://resend.com) account with a verified sending domain
- A [Stripe](https://stripe.com) account in test mode + [Stripe CLI](https://stripe.com/docs/stripe-cli) for webhook forwarding

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template and fill it in
cp .env.example .env.local
# Edit .env.local — at minimum DATABASE_URL, AUTH_SECRET, OWNER_EMAIL,
# RESEND_API_KEY, EMAIL_FROM, and the three STRIPE_* vars.

# 3. Generate AUTH_SECRET if you need one
openssl rand -base64 32

# 4. Push the schema to your database and seed it
pnpm db:push
pnpm db:seed

# 5. Start the dev server
pnpm dev
# → http://localhost:3000

# 6. (separate terminal) Forward Stripe webhooks to your local server
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET in .env.local

# Or run both at once:
pnpm dev:stripe
```

### First admin login

1. Make sure `OWNER_EMAIL` in `.env.local` matches the email you'll log in with.
2. Visit `http://localhost:3000/admin`.
3. Enter the email — a magic link will be sent via Resend (check your inbox or the Resend dashboard).
4. Click the link → you're in.

## Common scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run the dev server |
| `pnpm dev:stripe` | Run dev server + Stripe webhook forwarder concurrently |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build locally |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript no-emit check |
| `pnpm format` | Prettier write |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm db:generate` | Generate a new SQL migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Sync schema directly (dev only — skips migrations) |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |
| `pnpm db:seed` | Reseed products & demo data |

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel — the framework should auto-detect as Next.js.
3. Add the environment variables from `.env.example` in the Vercel dashboard.
4. Add a Vercel Postgres or connect your existing Neon database via the integration.
5. After first deploy, run migrations: from your local machine with the production `DATABASE_URL`, `pnpm db:migrate`.
6. **Configure the production Stripe webhook:**
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `charge.refunded`, `payment_intent.payment_failed`
   - Copy the signing secret into Vercel env as `STRIPE_WEBHOOK_SECRET`.
7. Verify the marketing site loads, then sign into `/admin` with your `OWNER_EMAIL`.

## Project structure

```
.
├── src/
│   ├── app/                    # App Router routes
│   │   ├── (marketing)/        # Public site
│   │   ├── (checkout)/         # Cart → Stripe → confirmation
│   │   ├── admin/              # Owner console (auth-gated)
│   │   └── api/                # Route handlers (checkout, webhooks, inquiries)
│   ├── components/             # React components (shared UI)
│   ├── db/                     # Drizzle schema, client, seed
│   ├── lib/                    # Auth, email, Stripe client, utils
│   └── server/                 # Server-only modules (queries, actions)
├── public/
│   └── assets/                 # Brand assets (logo, photography)
├── drizzle/                    # Generated SQL migrations
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PAYMENTS_TESTING.md
│   └── prompts/                # Build briefs handed to AI assistants
└── tests/
    └── e2e/                    # Playwright specs
```

## Contact

- Phone: **(416) 894-5755**
- Instagram: [@fouzias.kitchen](https://www.instagram.com/fouzias.kitchen)
- WhatsApp: [(416) 894-5755](https://wa.me/14168945755)
- Service area: Greater Toronto Area

## License

Proprietary — © Fouzia's Kitchen. All rights reserved.
