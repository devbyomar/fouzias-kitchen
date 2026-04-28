"use client";

import { useEffect } from "react";

/**
 * Mounts the original vanilla-JS marketing interactions (cart drawer,
 * mobile nav toggle, sticky CTA, scroll states, accordions, modals,
 * inquiry form) over the server-rendered marketing markup.
 *
 * The legacy script.js was built around DOM queries; running it once on
 * mount preserves identical behavior to the pre-migration site without
 * a risky line-by-line React rewrite. We can incrementally peel sections
 * out into proper React components later.
 */
export function MarketingScripts() {
  useEffect(() => {
    let cancelled = false;
    // Dynamically import so the script never runs server-side.
    void import("@/lib/marketing-scripts.js").then((mod) => {
      if (cancelled) return;
      // The legacy module self-initializes on import via DOMContentLoaded.
      // If DOMContentLoaded already fired (it has, by the time React mounted),
      // call the explicit init hook if exposed.
      if (typeof mod.init === "function") {
        mod.init();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
