"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership, type CurrentMembership } from "@/lib/current-membership";
import type { Role } from "@/lib/rbac";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type OwnerCheck = { ok: true; membership: CurrentMembership } | { ok: false; error: string };

async function requireOwner(): Promise<OwnerCheck> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (membership.role !== "OWNER") return { ok: false, error: "Only the organization owner can manage members." };
  return { ok: true, membership };
}

export async function updateMemberRole(membershipId: string, role: Role): Promise<ActionResult<undefined>> {
  const check = await requireOwner();
  if (!check.ok) return { ok: false, error: check.error };
  const { membership } = check;

  const target = await db.membership.findFirst({
    where: { id: membershipId, organizationId: membership.organization.id },
  });
  if (!target) return { ok: false, error: "Member not found." };

  if (target.role === "OWNER" && role !== "OWNER") {
    const ownerCount = await db.membership.count({ where: { organizationId: membership.organization.id, role: "OWNER" } });
    if (ownerCount <= 1) return { ok: false, error: "An organization needs at least one owner." };
  }

  await db.membership.update({ where: { id: membershipId }, data: { role } });

  await db.auditLog.create({
    data: {
      organizationId: membership.organization.id,
      actorId: membership.user.id,
      action: "member.role_changed",
      targetType: "Membership",
      targetId: membershipId,
      metadata: { from: target.role, to: role },
    },
  });

  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function removeMember(membershipId: string): Promise<ActionResult<undefined>> {
  const check = await requireOwner();
  if (!check.ok) return { ok: false, error: check.error };
  const { membership } = check;

  const target = await db.membership.findFirst({
    where: { id: membershipId, organizationId: membership.organization.id },
  });
  if (!target) return { ok: false, error: "Member not found." };

  if (target.userId === membership.user.id) {
    return { ok: false, error: "You can't remove yourself from the organization." };
  }

  if (target.role === "OWNER") {
    const ownerCount = await db.membership.count({ where: { organizationId: membership.organization.id, role: "OWNER" } });
    if (ownerCount <= 1) return { ok: false, error: "An organization needs at least one owner." };
  }

  await db.membership.delete({ where: { id: membershipId } });

  await db.auditLog.create({
    data: {
      organizationId: membership.organization.id,
      actorId: membership.user.id,
      action: "member.removed",
      targetType: "Membership",
      targetId: membershipId,
    },
  });

  revalidatePath("/admin");
  return { ok: true, data: undefined };
}
