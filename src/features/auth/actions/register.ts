"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas/auth-schemas";
import { bootstrapOrganizationForUser } from "./bootstrap-organization";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, companyName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({ data: { name, email, passwordHash } });
  await bootstrapOrganizationForUser(user.id, companyName);

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        error: "Account created, but automatic sign-in failed — please log in manually.",
      };
    }
    throw error;
  }

  return { ok: true };
}
