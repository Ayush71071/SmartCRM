import "server-only";
import { db } from "@/lib/db";
import type { AILogType, Prisma } from "@prisma/client";

type LogAIInput = {
  organizationId: string;
  userId: string;
  type: AILogType;
  model: string;
  input: Prisma.InputJsonValue;
  output: Prisma.InputJsonValue;
  tokensUsed?: number | null;
  relatedCustomerId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  relatedMeetingId?: string;
};

export async function logAIUsage(entry: LogAIInput) {
  return db.aILog.create({ data: entry });
}
