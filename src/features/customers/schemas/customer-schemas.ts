import { z } from "zod";

export const customerStatusValues = ["LEAD", "ACTIVE", "INACTIVE", "CHURNED"] as const;

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").or(z.literal("")).optional(),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(80).optional(),
  address: z.string().trim().max(240).optional(),
  status: z.enum(customerStatusValues),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  notes: z.string().trim().max(2000).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const noteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty.").max(4000),
  customerId: z.string().min(1),
});

export type NoteInput = z.infer<typeof noteSchema>;
