import "server-only";
import { db } from "@/lib/db";

export async function listMembers(organizationId: string) {
  const [memberships, dealStats, leadStats] = await Promise.all([
    db.membership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    // One grouped query for every member's won-deal count + revenue, instead
    // of two queries per member (N+1) — scales flat regardless of team size.
    db.deal.groupBy({
      by: ["createdById"],
      where: { organizationId, status: "WON" },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    db.lead.groupBy({
      by: ["assignedToId"],
      where: { organizationId, stage: { notIn: ["WON", "LOST"] } },
      _count: { _all: true },
    }),
  ]);

  const dealStatsByUser = new Map(dealStats.map((d) => [d.createdById, d]));
  const leadStatsByUser = new Map(leadStats.map((l) => [l.assignedToId, l]));

  const leaderboard = memberships.map((m) => ({
    userId: m.userId,
    wonDeals: dealStatsByUser.get(m.userId)?._count._all ?? 0,
    activeLeads: leadStatsByUser.get(m.userId)?._count._all ?? 0,
    revenue: dealStatsByUser.get(m.userId)?._sum.amount ?? 0,
  }));

  const invitations = await db.invitation.findMany({
    where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return { memberships, leaderboard, invitations };
}

export type MemberItem = Awaited<ReturnType<typeof listMembers>>["memberships"][number];
