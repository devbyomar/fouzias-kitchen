/**
 * Settings — store identity, fees, lead times, and storefront copy.
 */

import { getSettings } from "@/server/queries/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings · Owner Console" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const initial = await getSettings();

  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <p className="dashboard__eyebrow">Owner Console</p>
        <h1 className="dashboard__title">Settings</h1>
        <p className="order-detail__sub">
          Saved values are read by the storefront and order emails. Nothing is cached client-side.
        </p>
      </header>

      <section className="panel">
        <SettingsForm initial={initial} />
      </section>
    </div>
  );
}
