"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { logActivity } from "@/lib/activity";
import { canManageRecord } from "@/lib/rbac";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function recordUploadedDocument(input: {
  customerId: string;
  name: string;
  url: string;
  fileKey: string;
  mimeType: string;
  size: number;
}): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, organizationId: membership.organization.id },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  await db.document.create({
    data: {
      organizationId: membership.organization.id,
      customerId: input.customerId,
      name: input.name,
      url: input.url,
      fileKey: input.fileKey,
      mimeType: input.mimeType,
      size: input.size,
      uploadedById: membership.user.id,
    },
  });

  await logActivity({
    organizationId: membership.organization.id,
    type: "DOCUMENT",
    description: `${membership.user.name} uploaded "${input.name}".`,
    actorId: membership.user.id,
    customerId: input.customerId,
  });

  revalidatePath(`/customers/${input.customerId}`);
  return { ok: true, data: undefined };
}

export async function deleteDocument(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const doc = await db.document.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!doc) return { ok: false, error: "Document not found." };
  if (!canManageRecord(membership.role, doc.uploadedById === membership.user.id)) {
    return { ok: false, error: "You don't have permission to delete this document." };
  }

  await db.document.delete({ where: { id } });
  revalidatePath(`/customers/${doc.customerId}`);
  return { ok: true, data: undefined };
}
