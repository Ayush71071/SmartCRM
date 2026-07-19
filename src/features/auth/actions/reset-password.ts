"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schemas/auth-schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { token, password } = parsed.data;

  const resetToken = await db.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.$transaction([
    db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
