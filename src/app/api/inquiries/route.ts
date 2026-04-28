import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/inquiries
 *
 * Stub endpoint — accepts the inquiry payload from the marketing site's
 * contact form and validates it. Persistence to the `inquiries` table
 * lands in the database commit; until then we acknowledge with 202 so
 * the client-side success state still fires.
 */

const InquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  date: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

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

  // TODO(db): persist to inquiries table + dispatch owner notification email.
  // For now, log and acknowledge so the marketing form's success path runs.
  // eslint-disable-next-line no-console
  console.info("[inquiry:stub]", { email: parsed.data.email, dateField: parsed.data.date });

  return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
}
