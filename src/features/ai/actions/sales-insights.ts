"use server";

import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { generateStructured } from "@/lib/openai";
import { logAIUsage } from "@/lib/ai-log";
import { formatMoney } from "@/lib/format";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type InsightsResult = {
  topOpportunities: string[];
  weakAreas: string[];
  recommendations: string[];
  revenuePrediction: string;
};

export async function getSalesInsightsAction(): Promise<ActionResult<InsightsResult>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  const organizationId = membership.organization.id;

  const [openLeads, wonDeals, payments] = await Promise.all([
    db.lead.findMany({
      where: { organizationId, stage: { notIn: ["WON", "LOST"] } },
      include: { customer: { select: { name: true, company: true } } },
      orderBy: [{ value: "desc" }],
      take: 20,
    }),
    db.deal.findMany({ where: { organizationId, status: "WON" }, select: { amount: true, closedAt: true } }),
    db.payment.findMany({ where: { organizationId, status: "SUCCEEDED" }, select: { amount: true, createdAt: true } }),
  ]);

  const stageCounts = new Map<string, number>();
  for (const lead of openLeads) stageCounts.set(lead.stage, (stageCounts.get(lead.stage) ?? 0) + 1);

  const monthlyRevenue = new Map<string, number>();
  for (const p of payments) {
    const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
    monthlyRevenue.set(key, (monthlyRevenue.get(key) ?? 0) + p.amount);
  }
  const revenueValues = [...monthlyRevenue.values()];
  const avgMonthly = revenueValues.length > 0 ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length : 0;

  const { result, model, tokensUsed } = await generateStructured<InsightsResult>({
    system:
      "You are a sales operations analyst reviewing a CRM pipeline. Respond as JSON: " +
      '{"topOpportunities": string[], "weakAreas": string[], "recommendations": string[], "revenuePrediction": string}. ' +
      "Each array should have 2-4 short, concrete items grounded in the numbers given.",
    user: JSON.stringify({
      openLeadsByStage: Object.fromEntries(stageCounts),
      topOpenLeads: openLeads.slice(0, 5).map((l) => ({
        company: l.customer.company ?? l.customer.name,
        value: l.value / 100,
        probability: l.probability,
        stage: l.stage,
      })),
      wonDealsCount: wonDeals.length,
      totalWonValue: wonDeals.reduce((s, d) => s + d.amount, 0) / 100,
      avgMonthlyRevenue: avgMonthly / 100,
    }),
    mock: () => {
      const sorted = [...openLeads].sort((a, b) => b.value * b.probability - a.value * a.probability);
      const topOpportunities = sorted.slice(0, 3).map(
        (l) =>
          `${l.customer.company ?? l.customer.name} — ${formatMoney(l.value / 100, { compact: true })} at ${l.probability}% (${l.stage.toLowerCase()})`
      );

      const stalledStages = ["NEW", "CONTACTED"].filter((s) => (stageCounts.get(s) ?? 0) >= 2);
      const weakAreas =
        stalledStages.length > 0
          ? stalledStages.map((s) => `${stageCounts.get(s)} leads sitting in ${s.toLowerCase()} with no recent progress.`)
          : ["Pipeline stages look reasonably balanced right now."];

      const recommendations = [
        sorted[0]
          ? `Prioritize ${sorted[0].customer.company ?? sorted[0].customer.name} — it's your highest weighted opportunity.`
          : "Add more leads to the pipeline to generate momentum.",
        "Follow up on leads that have been in an early stage for over 2 weeks.",
        wonDeals.length > 0 ? "Ask recently won customers for referrals while satisfaction is high." : "Focus on closing your first deals to build momentum.",
      ];

      const predictedNextMonth = avgMonthly * 1.1;
      const revenuePrediction =
        avgMonthly > 0
          ? `Based on recent trend, next month's revenue is projected around ${formatMoney(predictedNextMonth / 100, { compact: true })}.`
          : "Not enough payment history yet to project next month's revenue.";

      return { topOpportunities, weakAreas, recommendations, revenuePrediction };
    },
  });

  await logAIUsage({
    organizationId,
    userId: membership.user.id,
    type: "SALES_INSIGHTS",
    model,
    input: { openLeadsCount: openLeads.length, wonDealsCount: wonDeals.length },
    output: result,
    tokensUsed,
  });

  return { ok: true, data: result };
}
