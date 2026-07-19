"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
type Plan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export async function updateOrgPlan(plan: Plan): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (membership.role !== "OWNER") return { ok: false, error: "Only the organization owner can change the plan." };

  await db.organization.update({ where: { id: membership.organization.id }, data: { plan } });

  await db.auditLog.create({
    data: {
      organizationId: membership.organization.id,
      actorId: membership.user.id,
      action: "organization.plan_changed",
      targetType: "Organization",
      targetId: membership.organization.id,
      metadata: { to: plan },
    },
  });

  revalidatePath("/admin");
  return { ok: true, data: undefined };
}
