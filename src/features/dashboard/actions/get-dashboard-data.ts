import "server-only";
import { subMonths, startOfMonth, startOfDay, endOfDay, format } from "date-fns";
import { db } from "@/lib/db";

const LEAD_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

function monthWindow(now: Date, months: number) {
  return Array.from({ length: months }, (_, i) => {
    const d = subMonths(now, months - 1 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM") };
  });
}

export async function getDashboardData(organizationId: string) {
  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, 5)); // current month + 5 prior = 6 months
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const buckets = monthWindow(now, 6);

  const [
    totalCustomers,
    activeLeadsCount,
    wonDealsCount,
    revenueAgg,
    tasksDueToday,
    upcomingMeetingsCount,
    leadsByStage,
    payments,
    wonDeals,
    customersBeforeWindow,
    newCustomersInWindow,
  ] = await Promise.all([
    db.customer.count({ where: { organizationId } }),
    db.lead.count({ where: { organizationId, stage: { notIn: ["WON", "LOST"] } } }),
    db.deal.count({ where: { organizationId, status: "WON" } }),
    db.payment.aggregate({ where: { organizationId, status: "SUCCEEDED" }, _sum: { amount: true } }),
    db.task.count({
      where: { organizationId, dueDate: { gte: todayStart, lte: todayEnd }, status: { not: "DONE" } },
    }),
    db.meeting.count({ where: { organizationId, status: "SCHEDULED", scheduledAt: { gte: now } } }),
    db.lead.groupBy({ by: ["stage"], where: { organizationId }, _count: { _all: true }, _sum: { value: true } }),
    db.payment.findMany({
      where: { organizationId, status: "SUCCEEDED", createdAt: { gte: windowStart } },
      select: { amount: true, createdAt: true },
    }),
    db.deal.findMany({
      where: { organizationId, status: "WON", closedAt: { gte: windowStart } },
      select: { amount: true, closedAt: true },
    }),
    db.customer.count({ where: { organizationId, createdAt: { lt: windowStart } } }),
    db.customer.findMany({
      where: { organizationId, createdAt: { gte: windowStart } },
      select: { createdAt: true },
    }),
  ]);

  const revenueByMonth = buckets.map(({ key, label }) => ({
    month: label,
    revenue: payments.filter((p) => format(p.createdAt, "yyyy-MM") === key).reduce((s, p) => s + p.amount, 0) / 100,
  }));

  const salesByMonth = buckets.map(({ key, label }) => ({
    month: label,
    deals: wonDeals.filter((d) => d.closedAt && format(d.closedAt, "yyyy-MM") === key).length,
    value:
      wonDeals
        .filter((d) => d.closedAt && format(d.closedAt, "yyyy-MM") === key)
        .reduce((s, d) => s + d.amount, 0) / 100,
  }));

  let cumulative = customersBeforeWindow;
  const customerGrowth = buckets.map(({ key, label }) => {
    cumulative += newCustomersInWindow.filter((c) => format(c.createdAt, "yyyy-MM") === key).length;
    return { month: label, customers: cumulative };
  });

  const stageCounts = new Map(leadsByStage.map((g) => [g.stage, { count: g._count._all, value: g._sum.value ?? 0 }]));
  const pipeline = LEAD_STAGES.map((stage) => ({
    stage,
    count: stageCounts.get(stage)?.count ?? 0,
    value: (stageCounts.get(stage)?.value ?? 0) / 100,
  }));

  const wonCount = stageCounts.get("WON")?.count ?? 0;
  const lostCount = stageCounts.get("LOST")?.count ?? 0;
  const closedCount = wonCount + lostCount;
  const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  return {
    stats: {
      totalCustomers,
      activeLeads: activeLeadsCount,
      wonDeals: wonDealsCount,
      revenue: (revenueAgg._sum.amount ?? 0) / 100,
      tasksDueToday,
      upcomingMeetings: upcomingMeetingsCount,
    },
    pipeline,
    conversionRate,
    charts: { revenueByMonth, salesByMonth, customerGrowth },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
