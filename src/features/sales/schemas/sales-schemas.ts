import { z } from "zod";

// Money fields in this file are all expressed in DOLLARS (decimals allowed) —
// the UI and validation work in the units a human types. Server actions
// convert to whole cents right before writing to Prisma, which is the only
// layer that deals in cents (matching the Int columns in schema.prisma).

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0, "Price can't be negative.").max(1_000_000),
  sku: z.string().trim().max(60).optional(),
  active: z.boolean(),
});
export type ProductInput = z.infer<typeof productSchema>;

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Required.").max(200),
  quantity: z.coerce.number().int().min(1).max(10_000),
  unitPrice: z.coerce.number().min(0).max(1_000_000),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Select a customer."),
  dealId: z.string().optional(),
  dueDate: z.string().min(1, "Pick a due date."),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item."),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  method: z.enum(["CARD", "BANK_TRANSFER", "CASH", "OTHER"]),
  reference: z.string().trim().max(120).optional(),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const dealSchema = z.object({
  customerId: z.string().min(1, "Select a customer."),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(160),
  amount: z.coerce.number().min(0).max(1_000_000),
  status: z.enum(["OPEN", "WON", "LOST"]),
});
export type DealInput = z.infer<typeof dealSchema>;
