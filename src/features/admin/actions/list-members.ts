import "server-only";
import { db } from "@/lib/db";

export async function listMembers(organizationId: string) {
  const memberships = await db.membership.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  const leaderboard = await Promise.all(
    memberships.map(async (m) => {
      const [wonDeals, activeLeads, revenue] = await Promise.all([
        db.deal.count({ where: { organizationId, createdById: m.userId, status: "WON" } }),
        db.lead.count({ where: { organizationId, assignedToId: m.userId, stage: { notIn: ["WON", "LOST"] } } }),
        db.deal.aggregate({
          where: { organizationId, createdById: m.userId, status: "WON" },
          _sum: { amount: true },
        }),
      ]);
      return { userId: m.userId, wonDeals, activeLeads, revenue: revenue._sum.amount ?? 0 };
    })
  );

  const invitations = await db.invitation.findMany({
    where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return { memberships, leaderboard, invitations };
}

export type MemberItem = Awaited<ReturnType<typeof listMembers>>["memberships"][number];
