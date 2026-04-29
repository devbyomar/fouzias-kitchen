import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { inquiries } from "@/db/schema";

/**
 * POST /api/inquiries
 *
 * Persists a public inquiry from the marketing site's contact form. We
 * never trust the client: every field is validated and length-capped via
 * zod before it touches the database.
 *
 * Owner-side notification (Resend email) lands in commit 8 alongside the
 * Stripe receipts so we have a unified outbound-email pipeline.
 */

const InquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  date: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = InquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const [row] = await db
      .insert(inquiries)
      .values({
        rawName: parsed.data.name,
        rawEmail: parsed.data.email.toLowerCase(),
        rawPhone: parsed.data.phone?.trim() || null,
        rawDate: parsed.data.date?.trim() || null,
        message: parsed.data.message,
        status: "new",
      })
      .returning({ id: inquiries.id });

    return NextResponse.json({ ok: true, id: row?.id }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[inquiries] insert failed", err);
    return NextResponse.json(
      { error: "Could not save inquiry. Please call us instead." },
      { status: 500 },
    );
  }
}
