import "server-only";
import { db } from "@/lib/db";

export async function getAIPageData(organizationId: string) {
  const [leads, customers, meetings] = await Promise.all([
    db.lead.findMany({
      where: { organizationId, stage: { notIn: ["WON", "LOST"] } },
      include: { customer: { select: { name: true, company: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.customer.findMany({
      where: { organizationId },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    db.meeting.findMany({
      where: { organizationId },
      include: { customer: { select: { name: true } } },
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  return { leads, customers, meetings };
}
