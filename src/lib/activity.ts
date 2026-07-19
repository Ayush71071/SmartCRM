import "server-only";
import { db } from "@/lib/db";
import type { ActivityType, Prisma } from "@prisma/client";

type LogActivityInput = {
  organizationId: string;
  type: ActivityType;
  description: string;
  actorId?: string | null;
  metadata?: Prisma.InputJsonValue;
  customerId?: string;
  leadId?: string;
  dealId?: string;
  taskId?: string;
  meetingId?: string;
};

/** Records one entry in a record's activity timeline (Customer/Lead/Deal/Task/Meeting). */
export async function logActivity(input: LogActivityInput) {
  const { organizationId, type, description, actorId, metadata, ...refs } = input;
  return db.activity.create({
    data: { organizationId, type, description, actorId: actorId ?? null, metadata, ...refs },
  });
}
