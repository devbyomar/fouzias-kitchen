# Fouzia’s Kitchen — Website

A premium, responsive, culturally rooted website for **Fouzia’s Kitchen**, a homegrown Afghan bakery and snack business specializing in:

- **Kulcha-e-Shor** — Afghan tea biscuits *($8 / dozen)*
- **Simyan** — savoury snack, mild or spicy *($6 / 200g — not a dessert)*
- **Kulcha-e-Khitai** — traditional Afghan cookie *($9 / dozen)*
- **Kulcha-e-Panjerei** — rosette cookies *($6 / dozen)*
- **Meringue Cookies** — light & airy family favourite *($6 / dozen)*

Built as a **single-page static site** (HTML, CSS, vanilla JS) so a small business owner can host it anywhere — Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any shared host — with **zero build step**.

---

## File structure

```
fouzias-kitchen/
├── index.html           ← All page content + SEO + structured data
├── styles.css           ← Design system + responsive styles
├── script.js            ← Mobile nav, reveal animations, form validation
├── assets/
│   ├── logo.svg         ← Brand mark (replace with official logo)
│   ├── _placeholder.svg ← Auto-fallback for any missing image
│   └── README.md        ← Detailed AI image prompts for every photo
└── README.md            ← (this file)
```

---

## Quick start

Open `index.html` directly in a browser, **or** serve locally:

```bash
# Python 3 (built-in)
python3 -m http.server 5173

# Or Node
npx serve .
```

Then visit <http://localhost:5173>.

---

## What to customize before going live

Search & replace these placeholders inside `index.html`:

| Placeholder | Where | Replace with |
|---|---|---|
| `[+1 (000) 000-0000]` / `+10000000000` | header tel link, footer, JSON-LD | Real phone |
| `[hello@fouziaskitchen.com]` | footer, JSON-LD | Real email |
| `[City]`, `[Region]`, `[Country]` | JSON-LD, FAQ, footer | Service location |
| `[Pickup Location]`, `[Delivery Areas]`, `[Service Area]` | FAQ, footer | Real fulfilment info |
| `[Mon–Sat, by inquiry]` | footer | Real hours |
| `https://fouziaskitchen.example.com/` | canonical, OG tags, JSON-LD | Final domain |
| Social `href="#"` | footer | Instagram / Facebook / WhatsApp URLs |
| `[3–5 days]`, `[2–3 weeks]` | FAQ | Your real lead times |

Then drop the brand assets:
1. Replace `assets/logo.svg` with the official Fouzia’s Kitchen logo.
2. Add real photography per the prompts in **`assets/README.md`** (any missing image automatically falls back to an elegant placeholder).

---

## Wiring up the inquiry form

The form is fully built — accessible labels, validation, success state. Connect it to any provider in 1 line:

**Option A — Formspree** (easiest, free tier):
```html
<form class="inquiry-form" id="inquiryForm" action="https://formspree.io/f/XXXXXX" method="POST">
```
Then remove the simulated `e.preventDefault()` block in `script.js`.

**Option B — Netlify Forms** (auto if hosted on Netlify):
```html
<form class="inquiry-form" id="inquiryForm" data-netlify="true" name="inquiry">
```

**Option C — EmailJS / Web3Forms / Getform** — same idea, swap the `action` URL.

---

## Brand & design system

Extracted from the logo:

| Token | Value | Use |
|---|---|---|
| Cream background | `#FAF6EE` | Primary background |
| Soft warm | `#F3ECDD` / `#EFE5D0` | Section banding |
| Deep brown | `#3B2418` | Body text, primary CTA |
| Warm gold | `#C9A24A` | Accent, dividers |
| Antique gold | `#9B7A2E` | Eyebrow text, hover |
| Terracotta | `#B5503A` | Spicy / required marker |
| Olive green | `#5A6B3A` | Trust dot, success state |

**Typography**
- Headings: *Cormorant Garamond* (refined, editorial serif)
- Body: *Inter* (clean, readable sans)
- Decorative accent: *Dancing Script* (used sparingly)

All design tokens live as CSS variables at the top of `styles.css` for easy adjustment.

---

## Sections included

1. Hero with primary + secondary CTA and trust micro-points
2. Brand Story / About with founder quote
3. Featured Products (4 cards with Afghan names, occasions, tags)
4. Full Menu (4 categories + allergen note)
5. Mild vs Spicy Simyan dedicated comparison
6. Occasion-Based Ordering (12 occasions + dark CTA band)
7. Afghan Tea & Hospitality / Heritage
8. Editorial masonry Gallery (8 images)
9. Testimonials (4 cards with star ratings)
10. How to Order (4 numbered steps)
11. FAQ (12 accordion questions)
12. Contact / Inquiry Form (all required fields, validation, success state)
13. Footer (logo, brand statement, nav, contact, socials, disclaimer)
14. Sticky mobile “Start Your Order” CTA

---

## Quality audit ✅

- ✅ Culturally Afghan without clichés (no flags, maps, costumes, chef hats)
- ✅ Premium yet homemade — editorial feel, warm tones
- ✅ Conversion-focused — CTAs in hero, after products, after occasions, sticky mobile
- ✅ Simyan correctly positioned as **savoury**, with mild/spicy clearly represented
- ✅ Kulcha-e-Shor / Khitai / Panjerei accurately described
- ✅ Mobile-first responsive (tested at 360 / 768 / 1024 / 1440 px)
- ✅ Accessible: skip link, semantic HTML, labelled fields, ARIA, focus states, reduced-motion
- ✅ SEO: meta description, keywords, OG tags, canonical, LocalBusiness JSON-LD
- ✅ Performant: no frameworks, two Google Font families, lightweight JS
- ✅ Editable by a non-technical owner — copy lives in `index.html` as plain HTML

---

## Optional next steps

- Add a `sitemap.xml` and `robots.txt` for production
- Compress photos with [Squoosh](https://squoosh.app) or [TinyPNG](https://tinypng.com)
- Hook up Google Business Profile and embed reviews
- Add Instagram feed (e.g. EmbedSocial / SnapWidget)
- Add a `/thank-you` page for form post-submission redirects
- Translate to Dari / Pashto for community audiences

---

*Traditional Afghan snacks and sweets, handcrafted with warmth, care, and heritage.*
