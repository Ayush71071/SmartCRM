"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { generateStructured } from "@/lib/openai";
import { logAIUsage } from "@/lib/ai-log";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type ScoreResult = { score: number; reason: string };

export async function scoreLeadAction(leadId: string): Promise<ActionResult<ScoreResult>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const lead = await db.lead.findFirst({
    where: { id: leadId, organizationId: membership.organization.id },
    include: { customer: true },
  });
  if (!lead) return { ok: false, error: "Lead not found." };

  const dealValue = lead.value / 100;

  const { result, model, tokensUsed } = await generateStructured<ScoreResult>({
    system:
      "You are a sales operations analyst. Score how likely a CRM lead is to close, from 0-100, and explain why in one concise sentence referencing concrete details (company, deal size, pipeline stage, engagement signals). Respond as JSON: {\"score\": number, \"reason\": string}.",
    user: JSON.stringify({
      company: lead.customer.company,
      industry: lead.customer.industry,
      stage: lead.stage,
      dealValue,
      currentProbability: lead.probability,
      source: lead.source,
      notes: lead.notes,
      hasNotes: Boolean(lead.notes),
    }),
    mock: () => {
      // Heuristic: stage progress (40%), deal size (30%), existing probability (20%), engagement (10%).
      const stageWeight: Record<string, number> = {
        NEW: 10,
        CONTACTED: 30,
        QUALIFIED: 50,
        PROPOSAL: 65,
        NEGOTIATION: 80,
        WON: 100,
        LOST: 0,
      };
      const stageScore = stageWeight[lead.stage] ?? 20;
      const sizeScore = Math.min(100, (dealValue / 500) * 10);
      const engagementScore = lead.notes ? 80 : 40;
      const score = Math.round(stageScore * 0.4 + sizeScore * 0.3 + lead.probability * 0.2 + engagementScore * 0.1);

      const sizeDescriptor = dealValue >= 20000 ? "a large deal size" : dealValue >= 5000 ? "a moderate deal size" : "a modest deal size";
      const engagementDescriptor = lead.notes ? "recorded engagement notes" : "no engagement notes yet";
      return {
        score: Math.max(0, Math.min(100, score)),
        reason: `High chance driven by ${sizeDescriptor} ($${dealValue.toLocaleString()}) at the ${lead.stage.toLowerCase()} stage, with ${engagementDescriptor}.`,
      };
    },
  });

  const score = Math.max(0, Math.min(100, Math.round(result.score)));

  await db.lead.update({
    where: { id: leadId },
    data: { score, scoreReason: result.reason, scoredAt: new Date() },
  });

  await logAIUsage({
    organizationId: membership.organization.id,
    userId: membership.user.id,
    type: "LEAD_SCORING",
    model,
    input: { leadId },
    output: { score, reason: result.reason },
    tokensUsed,
    relatedLeadId: leadId,
    relatedCustomerId: lead.customerId,
  });

  revalidatePath("/leads");
  revalidatePath("/ai");
  return { ok: true, data: { score, reason: result.reason } };
}
