import { z } from "zod";

export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const recurrenceValues = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(160),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(taskPriorityValues),
  dueDate: z.string().optional(),
  recurrence: z.enum(recurrenceValues),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
