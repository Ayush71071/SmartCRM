import { z } from "zod";

export const meetingSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(160),
  scheduledAt: z.string().min(1, "Pick a date and time."),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  location: z.string().trim().max(200).optional(),
  customerId: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  attendeeUserIds: z.array(z.string()).max(50),
  externalAttendees: z.string().trim().max(1000).optional(), // comma-separated emails
});

export type MeetingInput = z.infer<typeof meetingSchema>;
