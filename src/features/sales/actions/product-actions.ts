"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { canCreateRecords } from "@/lib/rbac";
import { productSchema, type ProductInput } from "@/features/sales/schemas/sales-schemas";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to create products." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const product = await db.product.create({
    data: { ...parsed.data, price: Math.round(parsed.data.price * 100), organizationId: membership.organization.id },
  });
  revalidatePath("/sales");
  return { ok: true, data: { id: product.id } };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to edit products." };

  const existing = await db.product.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Product not found." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await db.product.update({ where: { id }, data: { ...parsed.data, price: Math.round(parsed.data.price * 100) } });
  revalidatePath("/sales");
  return { ok: true, data: undefined };
}

export async function deleteProduct(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to delete products." };

  const existing = await db.product.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Product not found." };

  const usedInDeal = await db.dealProduct.findFirst({ where: { productId: id } });
  if (usedInDeal) {
    return { ok: false, error: "This product is used in a deal and can't be deleted. Mark it inactive instead." };
  }

  await db.product.delete({ where: { id } });
  revalidatePath("/sales");
  return { ok: true, data: undefined };
}
