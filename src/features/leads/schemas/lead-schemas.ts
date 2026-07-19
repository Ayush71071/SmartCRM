import { z } from "zod";

export const leadStageValues = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const leadSchema = z.object({
  customerId: z.string().min(1, "Select a customer."),
  stage: z.enum(leadStageValues),
  value: z.coerce.number().int().min(0).max(100_000_000),
  probability: z.coerce.number().int().min(0).max(100),
  notes: z.string().trim().max(2000).optional(),
  assignedToId: z.string().optional(),
  source: z.string().trim().max(80).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
