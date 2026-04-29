/**
 * Inquiry detail page — full message, contact info, status controls, and
 * the convert-to-order form (only shown when not yet converted).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getInquiryById } from "@/server/queries/inquiries";
import { InquiryStatusButtons } from "@/components/admin/InquiryStatusButtons";
import { InquiryConvertForm } from "@/components/admin/InquiryConvertForm";
import { formatDate, formatRelative, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getInquiryById(id);
  if (!data) return { title: "Inquiry not found" };
  return { title: `Inquiry from ${data.inquiry.rawName} · Owner Console` };
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInquiryById(id);
  if (!data) notFound();
  const { inquiry, convertedOrderNumber } = data;

  return (
    <div className="dashboard">
      <header className="order-detail__head">
        <div>
          <p className="dashboard__eyebrow">
            <Link href="/admin/inquiries" className="back-link">← All inquiries</Link>
          </p>
          <h1 className="dashboard__title">
            {inquiry.rawName}
            <span className={`pill pill--inq-${inquiry.status}`} style={{ marginLeft: ".75rem" }}>
              {inquiry.status}
            </span>
          </h1>
          <p className="order-detail__sub">
            Received {formatRelative(inquiry.createdAt)} · {formatDate(inquiry.createdAt)} at{" "}
            {formatTime(inquiry.createdAt)}
          </p>
        </div>
      </header>

      <section className="panel">
        <header className="panel__head">
          <h2 className="panel__title">Status</h2>
        </header>
        <InquiryStatusButtons inquiryId={inquiry.id} current={inquiry.status} />
      </section>

      <div className="dashboard__grid">
        <article className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Message</h2>
          </header>
          <p className="message-body">{inquiry.message}</p>
        </article>

        <article className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Contact</h2>
          </header>
          <dl className="kv">
            <div><dt>Name</dt><dd>{inquiry.rawName}</dd></div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${inquiry.rawEmail}`}>{inquiry.rawEmail}</a>
              </dd>
            </div>
            {inquiry.rawPhone && (
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${inquiry.rawPhone}`}>{inquiry.rawPhone}</a>
                </dd>
              </div>
            )}
            {inquiry.rawDate && (
              <div><dt>Preferred date</dt><dd>{inquiry.rawDate}</dd></div>
            )}
          </dl>
        </article>

        <article className="panel panel--wide">
          <header className="panel__head">
            <h2 className="panel__title">Convert to order</h2>
          </header>
          {inquiry.convertedOrderId ? (
            <p>
              Already converted to{" "}
              <Link href={`/admin/orders/${inquiry.convertedOrderId}`}>
                order #{convertedOrderNumber ?? "—"}
              </Link>
              .
            </p>
          ) : (
            <InquiryConvertForm inquiryId={inquiry.id} />
          )}
        </article>
      </div>
    </div>
  );
}
