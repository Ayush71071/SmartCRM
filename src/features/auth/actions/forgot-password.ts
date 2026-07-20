"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/resend";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schemas/auth-schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
// Floors the "email not found" path to roughly the same wall-clock time as
// the "found" path (token creation + email send), so response timing alone
// can't be used to enumerate which emails are registered.
const MIN_RESPONSE_MS = 400;

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const started = Date.now();
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await getClientIp();
  // Limit both per-target (stops email-bombing one address) and per-IP
  // (stops broad abuse/enumeration) — always return ok either way so the
  // response itself never reveals which limit (if any) was hit.
  const withinEmailLimit = checkRateLimit(`forgot-password:email:${parsed.data.email}`, 3, 60 * 60 * 1000);
  const withinIpLimit = checkRateLimit(`forgot-password:ip:${ip}`, 10, 60 * 60 * 1000);

  const user = withinEmailLimit && withinIpLimit ? await db.user.findUnique({ where: { email: parsed.data.email } }) : null;

  // Always return ok — never reveal whether an email is registered.
  if (!user || !user.passwordHash) {
    const elapsed = Date.now() - started;
    if (elapsed < MIN_RESPONSE_MS) await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your SmartCRM password",
    html: `
      <p>Hi ${user.name},</p>
      <p>Click the link below to reset your SmartCRM password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  return { ok: true };
}
