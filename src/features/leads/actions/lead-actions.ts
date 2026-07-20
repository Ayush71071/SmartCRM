"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { logActivity } from "@/lib/activity";
import { canManageRecord, canCreateRecords } from "@/lib/rbac";
import { verifyMembersInOrg } from "@/lib/tenant-guard";
import { leadSchema, leadStageValues, type LeadInput } from "@/features/leads/schemas/lead-schemas";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function isOwner(userId: string, lead: { assignedToId: string | null; createdById: string }) {
  return lead.assignedToId === userId || lead.createdById === userId;
}

export async function createLead(input: LeadInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to create leads." };

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const customer = await db.customer.findFirst({
    where: { id: parsed.data.customerId, organizationId: membership.organization.id },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  if (parsed.data.assignedToId && !(await verifyMembersInOrg(membership.organization.id, [parsed.data.assignedToId]))) {
    return { ok: false, error: "Assignee not found." };
  }

  const count = await db.lead.count({ where: { organizationId: membership.organization.id, stage: parsed.data.stage } });

  const lead = await db.lead.create({
    data: {
      ...parsed.data,
      value: Math.round(parsed.data.value * 100),
      assignedToId: parsed.data.assignedToId || null,
      organizationId: membership.organization.id,
      createdById: membership.user.id,
      position: count,
    },
  });

  await logActivity({
    organizationId: membership.organization.id,
    type: "SYSTEM",
    description: `${membership.user.name} created a lead for ${customer.name}.`,
    actorId: membership.user.id,
    customerId: customer.id,
    leadId: lead.id,
  });

  revalidatePath("/leads");
  return { ok: true, data: { id: lead.id } };
}

export async function updateLead(id: string, input: LeadInput): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.lead.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Lead not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, existing))) {
    return { ok: false, error: "You don't have permission to edit this lead." };
  }

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  if (parsed.data.customerId !== existing.customerId) {
    const customer = await db.customer.findFirst({
      where: { id: parsed.data.customerId, organizationId: membership.organization.id },
    });
    if (!customer) return { ok: false, error: "Customer not found." };
  }
  if (parsed.data.assignedToId && !(await verifyMembersInOrg(membership.organization.id, [parsed.data.assignedToId]))) {
    return { ok: false, error: "Assignee not found." };
  }

  const stageChanged = existing.stage !== parsed.data.stage;
  let position = existing.position;
  if (stageChanged) {
    position = await db.lead.count({ where: { organizationId: membership.organization.id, stage: parsed.data.stage } });
  }

  await db.lead.update({
    where: { id },
    data: {
      ...parsed.data,
      value: Math.round(parsed.data.value * 100),
      assignedToId: parsed.data.assignedToId || null,
      position,
    },
  });

  if (stageChanged) {
    await logActivity({
      organizationId: membership.organization.id,
      type: "STAGE_CHANGE",
      description: `${membership.user.name} moved this lead from ${existing.stage} to ${parsed.data.stage}.`,
      actorId: membership.user.id,
      customerId: existing.customerId,
      leadId: id,
    });
  }

  revalidatePath("/leads");
  return { ok: true, data: undefined };
}

/**
 * Persists a drag-and-drop move: sets the moved lead's stage and re-indexes
 * every lead in the destination column to match the client's new order.
 */
export async function moveLead(leadId: string, toStage: string, orderedIdsInColumn: string[]): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  if (!(leadStageValues as readonly string[]).includes(toStage)) {
    return { ok: false, error: "Invalid stage." };
  }

  const lead = await db.lead.findFirst({ where: { id: leadId, organizationId: membership.organization.id } });
  if (!lead) return { ok: false, error: "Lead not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, lead))) {
    return { ok: false, error: "You don't have permission to move this lead." };
  }

  // orderedIdsInColumn is client-supplied (the post-drag column order) — verify
  // every id actually belongs to this org before bulk-updating positions,
  // otherwise a crafted request could overwrite another org's lead positions.
  const ownedLeads = await db.lead.findMany({
    where: { id: { in: orderedIdsInColumn }, organizationId: membership.organization.id },
    select: { id: true },
  });
  const ownedIds = new Set(ownedLeads.map((l) => l.id));
  const safeOrderedIds = orderedIdsInColumn.filter((id) => ownedIds.has(id));

  const fromStage = lead.stage;

  await db.$transaction([
    db.lead.update({ where: { id: leadId }, data: { stage: toStage as never } }),
    ...safeOrderedIds.map((id, index) => db.lead.update({ where: { id }, data: { position: index } })),
  ]);

  if (fromStage !== toStage) {
    await logActivity({
      organizationId: membership.organization.id,
      type: "STAGE_CHANGE",
      description: `${membership.user.name} moved this lead from ${fromStage} to ${toStage}.`,
      actorId: membership.user.id,
      customerId: lead.customerId,
      leadId,
    });
  }

  revalidatePath("/leads");
  return { ok: true, data: undefined };
}

export async function deleteLead(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.lead.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Lead not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, existing))) {
    return { ok: false, error: "You don't have permission to delete this lead." };
  }

  await db.lead.delete({ where: { id } });
  revalidatePath("/leads");
  return { ok: true, data: undefined };
}
