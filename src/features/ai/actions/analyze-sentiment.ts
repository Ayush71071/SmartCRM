"use server";

import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { generateStructured } from "@/lib/openai";
import { logAIUsage } from "@/lib/ai-log";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type SentimentResult = { sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE"; reasoning: string };

const POSITIVE_WORDS = ["great", "excited", "love", "happy", "impressed", "excellent", "interested", "yes", "perfect"];
const NEGATIVE_WORDS = ["concern", "issue", "problem", "unhappy", "delay", "frustrat", "cancel", "expensive", "no longer"];

export async function analyzeSentimentAction(customerId: string): Promise<ActionResult<SentimentResult>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: membership.organization.id },
    include: { notesList: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  const combinedText = [customer.notes, ...customer.notesList.map((n) => n.content)].filter(Boolean).join("\n");
  if (!combinedText.trim()) {
    return { ok: false, error: "This customer has no notes yet to analyze." };
  }

  const { result, model, tokensUsed } = await generateStructured<SentimentResult>({
    system:
      'You are a customer success analyst. Classify the overall sentiment expressed in these CRM notes as "POSITIVE", "NEUTRAL", or "NEGATIVE", and explain your reasoning in one sentence citing specific phrases. Respond as JSON: {"sentiment": string, "reasoning": string}.',
    user: combinedText,
    mock: () => {
      const lower = combinedText.toLowerCase();
      const positiveHits = POSITIVE_WORDS.filter((w) => lower.includes(w));
      const negativeHits = NEGATIVE_WORDS.filter((w) => lower.includes(w));

      let sentiment: SentimentResult["sentiment"] = "NEUTRAL";
      if (positiveHits.length > negativeHits.length) sentiment = "POSITIVE";
      else if (negativeHits.length > positiveHits.length) sentiment = "NEGATIVE";

      const reasoning =
        positiveHits.length === 0 && negativeHits.length === 0
          ? "Notes are largely factual with no strong positive or negative language detected."
          : `Detected ${positiveHits.length ? `positive language ("${positiveHits.slice(0, 2).join('", "')}")` : "no positive language"} and ${negativeHits.length ? `negative language ("${negativeHits.slice(0, 2).join('", "')}")` : "no negative language"}.`;

      return { sentiment, reasoning };
    },
  });

  await logAIUsage({
    organizationId: membership.organization.id,
    userId: membership.user.id,
    type: "SENTIMENT_ANALYSIS",
    model,
    input: { customerId, noteCount: customer.notesList.length },
    output: result,
    tokensUsed,
    relatedCustomerId: customerId,
  });

  return { ok: true, data: result };
}
