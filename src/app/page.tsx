import { MarketingScripts } from "@/components/MarketingScripts";
import { MARKETING_HTML } from "./_marketing-html";

/**
 * Marketing homepage. Server-rendered as static HTML for instant first paint
 * and SEO parity with the pre-migration site. The <MarketingScripts /> island
 * hydrates on the client to wire up the cart drawer, nav toggle, accordions,
 * modals, and inquiry form.
 *
 * NOTE: The cart inquiry form currently posts to /api/inquiries (stubbed in
 * this commit; persisted in the DB layer commit). All other interactions are
 * fully functional.
 */
export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div dangerouslySetInnerHTML={{ __html: MARKETING_HTML }} />
      <MarketingScripts />
    </>
  );
}
