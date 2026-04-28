/**
 * Resend client + transactional email helpers.
 *
 * Lazy-instantiated so the Next.js build doesn't require RESEND_API_KEY
 * to be set (e.g. CI builds without secrets). Calls fail loudly at runtime
 * if the key is missing when an email is actually attempted.
 */

import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let _client: Resend | null = null;

function client(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured — emails cannot be sent");
  }
  if (!_client) _client = new Resend(env.RESEND_API_KEY);
  return _client;
}

function from(): string {
  return env.EMAIL_FROM ?? "Fouzia's Kitchen <onboarding@resend.dev>";
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailArgs) {
  const result = await client().emails.send({
    from: from(),
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  if (result.error) {
    // eslint-disable-next-line no-console
    console.error("[email:send-failed]", { to, subject, error: result.error });
    throw new Error(`Failed to send email: ${result.error.message}`);
  }
  return result.data;
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

interface MagicLinkArgs {
  url: string;
  email: string;
}

export function renderMagicLinkEmail({ url, email }: MagicLinkArgs) {
  const safeUrl = url; // Already URL-encoded by NextAuth.
  const subject = "Your Fouzia's Kitchen sign-in link";
  const text = [
    `Hi,`,
    ``,
    `Click the link below to sign in to the Fouzia's Kitchen owner console.`,
    `This link expires in 24 hours and can only be used once.`,
    ``,
    safeUrl,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
    ``,
    `— Fouzia's Kitchen`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF6EE;font-family:-apple-system,Segoe UI,Inter,Helvetica,Arial,sans-serif;color:#2A1F18">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EE;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#FFFDF8;border:1px solid #ECE3D2;border-radius:12px;padding:32px">
        <tr><td>
          <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:28px;margin:0 0 8px;color:#5A3A20">Fouzia's Kitchen</h1>
          <p style="margin:0 0 24px;color:#7A6A58;font-size:14px">Owner console sign-in</p>

          <p style="margin:0 0 16px;font-size:16px;line-height:1.55">Hi — tap the button below to sign in. This link is for <strong>${email}</strong>, expires in 24 hours, and can only be used once.</p>

          <p style="margin:24px 0">
            <a href="${safeUrl}" style="display:inline-block;background:#5A3A20;color:#FFFDF8;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px">Sign in to the console</a>
          </p>

          <p style="margin:0 0 8px;font-size:13px;color:#7A6A58">Or copy this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#7A6A58;word-break:break-all">${safeUrl}</p>

          <hr style="border:none;border-top:1px solid #ECE3D2;margin:24px 0" />
          <p style="margin:0;font-size:12px;color:#9A8A78">If you didn't request this, you can safely ignore this email — no account changes will be made.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#9A8A78">© Fouzia's Kitchen · Greater Toronto Area</p>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, text };
}
