import "server-only";
import { db } from "@/lib/db";
import { leadStageValues } from "@/features/leads/schemas/lead-schemas";

export async function getBoardData(organizationId: string) {
  const [leads, customers, members] = await Promise.all([
    db.lead.findMany({
      where: { organizationId },
      include: {
        customer: { select: { id: true, name: true, company: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
      },
      orderBy: { position: "asc" },
    }),
    db.customer.findMany({
      where: { organizationId },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    db.membership.findMany({
      where: { organizationId },
      select: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const columns = Object.fromEntries(
    leadStageValues.map((stage) => [stage, leads.filter((l) => l.stage === stage)])
  ) as Record<(typeof leadStageValues)[number], typeof leads>;

  return { columns, customers, members: members.map((m) => m.user) };
}

type BoardData = Awaited<ReturnType<typeof getBoardData>>;
export type BoardLead = BoardData["columns"][keyof BoardData["columns"]][number];
export type BoardMember = BoardData["members"][number];
export type BoardCustomer = BoardData["customers"][number];
