"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { logActivity } from "@/lib/activity";
import { canManageRecord, canCreateRecords } from "@/lib/rbac";
import {
  customerSchema,
  noteSchema,
  type CustomerInput,
  type NoteInput,
} from "@/features/customers/schemas/customer-schemas";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createCustomer(input: CustomerInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) {
    return { ok: false, error: "You don't have permission to create customers." };
  }

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const customer = await db.customer.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      organizationId: membership.organization.id,
      ownerId: membership.user.id,
      createdById: membership.user.id,
    },
  });

  await logActivity({
    organizationId: membership.organization.id,
    type: "SYSTEM",
    description: `${membership.user.name} created this customer.`,
    actorId: membership.user.id,
    customerId: customer.id,
  });

  revalidatePath("/customers");
  return { ok: true, data: { id: customer.id } };
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.customer.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Customer not found." };
  if (!canManageRecord(membership.role, existing.ownerId === membership.user.id)) {
    return { ok: false, error: "You don't have permission to edit this customer." };
  }

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const statusChanged = existing.status !== parsed.data.status;

  await db.customer.update({
    where: { id },
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  await logActivity({
    organizationId: membership.organization.id,
    type: statusChanged ? "STATUS_CHANGE" : "SYSTEM",
    description: statusChanged
      ? `${membership.user.name} changed the status from ${existing.status} to ${parsed.data.status}.`
      : `${membership.user.name} updated this customer's details.`,
    actorId: membership.user.id,
    customerId: id,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true, data: undefined };
}

export async function deleteCustomer(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.customer.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Customer not found." };
  if (!canManageRecord(membership.role, existing.ownerId === membership.user.id)) {
    return { ok: false, error: "You don't have permission to delete this customer." };
  }

  await db.customer.delete({ where: { id } });
  revalidatePath("/customers");
  return { ok: true, data: undefined };
}

export async function addNote(input: NoteInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to add notes." };

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const customer = await db.customer.findFirst({
    where: { id: parsed.data.customerId, organizationId: membership.organization.id },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  const note = await db.note.create({
    data: {
      organizationId: membership.organization.id,
      content: parsed.data.content,
      customerId: parsed.data.customerId,
      createdById: membership.user.id,
    },
  });

  await logActivity({
    organizationId: membership.organization.id,
    type: "NOTE",
    description: `${membership.user.name} added a note.`,
    actorId: membership.user.id,
    customerId: parsed.data.customerId,
  });

  revalidatePath(`/customers/${parsed.data.customerId}`);
  return { ok: true, data: { id: note.id } };
}
