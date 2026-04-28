import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "https://fouziaskitchen.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Fouzia's Kitchen — Handcrafted Afghan Snacks & Sweets",
    template: "%s · Fouzia's Kitchen",
  },
  description:
    "Fouzia's Kitchen prepares traditional Afghan snacks and sweets — Kulcha-e-Shor tea biscuits, mild & spicy Simyan, Kulcha-e-Khitai, Rosette Cookies (Kulcha-e-Panjerei), and Meringue Cookies. Made fresh to order for tea time, Eid, weddings, and family gatherings.",
  keywords: [
    "Afghan bakery",
    "Afghan snacks",
    "Afghan sweets",
    "Kulcha-e-Shor",
    "Simyan",
    "Kulcha-e-Khitai",
    "Kulcha-e-Panjerei",
    "Rosette cookies",
    "meringue cookies",
    "Afghan tea biscuits",
    "Eid sweets",
    "Afghan dessert platters",
    "Greater Toronto Area",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Fouzia's Kitchen — Handcrafted Afghan Snacks & Sweets",
    description:
      "Traditional Afghan snacks and sweets, handcrafted with warmth, heritage, and the flavours of home.",
    url: siteUrl,
    images: [{ url: "/assets/og-image.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fouzia's Kitchen",
    description:
      "Traditional Afghan snacks and sweets, handcrafted with warmth, heritage, and the flavours of home.",
    images: ["/assets/og-image.jpg"],
  },
  icons: {
    icon: [{ url: "/assets/logo.svg", type: "image/svg+xml" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF6EE",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Fouzia's Kitchen",
  description:
    "Traditional Afghan snacks and sweets, handcrafted with warmth, heritage, and the flavours of home.",
  image: `${siteUrl}/assets/og-image.jpg`,
  servesCuisine: ["Afghan", "Central Asian", "Middle Eastern"],
  priceRange: "$$",
  areaServed: {
    "@type": "City",
    name: "Greater Toronto Area",
  },
  telephone: "+1-416-894-5755",
  url: siteUrl,
  sameAs: ["https://www.instagram.com/fouzias.kitchen"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Dancing+Script:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          // Static JSON: safe to inject; keeps SEO parity with the original site.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
