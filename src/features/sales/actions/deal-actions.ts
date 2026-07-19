"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { canCreateRecords, canManageRecord } from "@/lib/rbac";
import { dealSchema, type DealInput } from "@/features/sales/schemas/sales-schemas";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createDeal(input: DealInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to create deals." };

  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const customer = await db.customer.findFirst({
    where: { id: parsed.data.customerId, organizationId: membership.organization.id },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  const deal = await db.deal.create({
    data: {
      organizationId: membership.organization.id,
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      amount: Math.round(parsed.data.amount * 100),
      status: parsed.data.status,
      closedAt: parsed.data.status !== "OPEN" ? new Date() : null,
      createdById: membership.user.id,
    },
  });

  revalidatePath("/sales");
  return { ok: true, data: { id: deal.id } };
}

export async function deleteDeal(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.deal.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Deal not found." };
  if (!canManageRecord(membership.role, existing.createdById === membership.user.id)) {
    return { ok: false, error: "You don't have permission to delete this deal." };
  }

  await db.deal.delete({ where: { id } });
  revalidatePath("/sales");
  return { ok: true, data: undefined };
}
