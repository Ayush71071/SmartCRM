"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/resend";
import type { Role } from "@/lib/rbac";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createInvitation(email: string, role: Role): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (membership.role !== "OWNER" && membership.role !== "MANAGER") {
    return { ok: false, error: "You don't have permission to invite members." };
  }
  if (role === "OWNER" && membership.role !== "OWNER") {
    return { ok: false, error: "Only an owner can invite another owner." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { ok: false, error: "Enter an email address." };

  const existingMember = await db.membership.findFirst({
    where: { organizationId: membership.organization.id, user: { email: normalizedEmail } },
  });
  if (existingMember) return { ok: false, error: "This person is already a member." };

  const token = randomBytes(24).toString("hex");
  await db.invitation.create({
    data: {
      organizationId: membership.organization.id,
      email: normalizedEmail,
      role,
      token,
      invitedById: membership.user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
  await sendEmail({
    to: normalizedEmail,
    subject: `You've been invited to join ${membership.organization.name} on SmartCRM`,
    html: `
      <p>${membership.user.name} invited you to join <strong>${membership.organization.name}</strong> on SmartCRM as a ${role.replace("_", " ").toLowerCase()}.</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });

  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function revokeInvitation(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (membership.role !== "OWNER" && membership.role !== "MANAGER") {
    return { ok: false, error: "You don't have permission to manage invitations." };
  }

  const invitation = await db.invitation.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!invitation) return { ok: false, error: "Invitation not found." };

  await db.invitation.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function acceptInvitation(token: string): Promise<ActionResult<{ organizationSlug: string }>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { ok: false, error: "Not signed in." };

  const invitation = await db.invitation.findUnique({ where: { token }, include: { organization: true } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return { ok: false, error: "This invitation is invalid or has expired." };
  }
  if (invitation.email !== session.user.email.toLowerCase()) {
    return { ok: false, error: `This invitation was sent to ${invitation.email} — log in with that email to accept it.` };
  }

  const existing = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: invitation.organizationId } },
  });
  if (!existing) {
    await db.membership.create({
      data: { userId: session.user.id, organizationId: invitation.organizationId, role: invitation.role },
    });
  }

  await db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });

  return { ok: true, data: { organizationSlug: invitation.organization.slug } };
}
