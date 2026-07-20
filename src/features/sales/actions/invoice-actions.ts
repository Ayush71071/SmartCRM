"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { canCreateRecords } from "@/lib/rbac";
import { invoiceSchema, paymentSchema, type InvoiceInput, type PaymentInput } from "@/features/sales/schemas/sales-schemas";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createInvoice(input: InvoiceInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to create invoices." };

  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const customer = await db.customer.findFirst({
    where: { id: parsed.data.customerId, organizationId: membership.organization.id },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  if (parsed.data.dealId) {
    const deal = await db.deal.findFirst({
      where: { id: parsed.data.dealId, organizationId: membership.organization.id },
    });
    if (!deal) return { ok: false, error: "Deal not found." };
  }

  const itemsInCents = parsed.data.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: Math.round(item.unitPrice * 100),
  }));
  const subtotal = itemsInCents.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Math.round(subtotal * (parsed.data.taxRate / 100));
  const total = subtotal + tax;

  // Invoice numbers are derived from a count, which two concurrent requests
  // could read identically before either commits — retrying on the unique
  // constraint (rather than trusting the count) makes this safe under
  // concurrency instead of surfacing a raw 500 to the second requester.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const count = await db.invoice.count({ where: { organizationId: membership.organization.id } });
    const invoiceNumber = `INV-${1000 + count + 1 + attempt}`;

    try {
      const invoice = await db.invoice.create({
        data: {
          organizationId: membership.organization.id,
          customerId: parsed.data.customerId,
          dealId: parsed.data.dealId || null,
          invoiceNumber,
          dueDate: new Date(parsed.data.dueDate),
          subtotal,
          tax,
          total,
          notes: parsed.data.notes,
          createdById: membership.user.id,
          status: "SENT",
          items: {
            create: itemsInCents.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
      });

      revalidatePath("/sales");
      return { ok: true, data: { id: invoice.id } };
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < MAX_ATTEMPTS - 1) continue;
      throw error;
    }
  }

  return { ok: false, error: "Could not generate a unique invoice number — please try again." };
}

export async function deleteInvoice(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to delete invoices." };

  const existing = await db.invoice.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Invoice not found." };

  await db.invoice.delete({ where: { id } });
  revalidatePath("/sales");
  return { ok: true, data: undefined };
}

export async function recordPayment(input: PaymentInput): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to record payments." };

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const invoice = await db.invoice.findFirst({
    where: { id: parsed.data.invoiceId, organizationId: membership.organization.id },
    include: { payments: true },
  });
  if (!invoice) return { ok: false, error: "Invoice not found." };

  const amountInCents = Math.round(parsed.data.amount * 100);
  const alreadyPaid = invoice.payments.filter((p) => p.status === "SUCCEEDED").reduce((s, p) => s + p.amount, 0);
  if (alreadyPaid + amountInCents > invoice.total) {
    return { ok: false, error: "That payment would exceed the invoice total." };
  }

  await db.payment.create({
    data: {
      organizationId: membership.organization.id,
      invoiceId: invoice.id,
      amount: amountInCents,
      method: parsed.data.method,
      status: "SUCCEEDED",
      paidAt: new Date(),
      reference: parsed.data.reference,
    },
  });

  const fullyPaid = alreadyPaid + amountInCents >= invoice.total;
  if (fullyPaid) {
    await db.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
  }

  revalidatePath("/sales");
  return { ok: true, data: undefined };
}
