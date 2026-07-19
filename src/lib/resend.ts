import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL || "SmartCRM <onboarding@resend.dev>";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends an email via Resend, or — when no RESEND_API_KEY is configured —
 * logs it to the server console so auth/reminder flows are fully testable
 * without signing up for anything.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!resend) {
    console.log(`\n[dev email — no RESEND_API_KEY set]\nTo: ${to}\nSubject: ${subject}\n${html}\n`);
    return { mocked: true as const };
  }

  const result = await resend.emails.send({ from: FROM, to, subject, html });
  return { mocked: false as const, id: result.data?.id };
}
