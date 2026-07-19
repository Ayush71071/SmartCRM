"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/resend";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schemas/auth-schemas";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Always return ok — never reveal whether an email is registered.
  if (!user || !user.passwordHash) return { ok: true };

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
