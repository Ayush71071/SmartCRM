"use server";

import { differenceInDays } from "date-fns";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { generateStructured } from "@/lib/openai";
import { logAIUsage } from "@/lib/ai-log";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type Suggestion = { action: string; reason: string };
type SuggestionsResult = { suggestions: Suggestion[] };

export async function suggestTasksAction(customerId: string): Promise<ActionResult<SuggestionsResult>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: membership.organization.id },
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 1 },
      meetings: { orderBy: { scheduledAt: "desc" }, take: 1 },
      tasks: { where: { status: { not: "DONE" } } },
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  const lastMeeting = customer.meetings[0];
  const daysSinceLastMeeting = lastMeeting ? differenceInDays(new Date(), new Date(lastMeeting.scheduledAt)) : null;
  const activeLead = customer.leads[0];

  const { result, model, tokensUsed } = await generateStructured<SuggestionsResult>({
    system:
      "You are a sales assistant recommending next actions for a CRM contact. Respond as JSON: " +
      '{"suggestions": [{"action": string, "reason": string}]}. ' +
      "Give 2-4 suggestions, each a short imperative action (e.g. \"Call customer\", \"Send proposal\", \"Schedule meeting\", \"Follow up by email\") with a one-sentence reason grounded in the activity given.",
    user: JSON.stringify({
      customerStatus: customer.status,
      activeLeadStage: activeLead?.stage,
      daysSinceLastMeeting,
      openTasksCount: customer.tasks.length,
      recentActivity: customer.activities.map((a) => a.description),
    }),
    mock: () => {
      const suggestions: Suggestion[] = [];

      if (activeLead && ["PROPOSAL", "NEGOTIATION"].includes(activeLead.stage)) {
        suggestions.push({ action: "Send proposal", reason: `Lead is in the ${activeLead.stage.toLowerCase()} stage and ready for a formal offer.` });
      }
      if (daysSinceLastMeeting === null || daysSinceLastMeeting > 14) {
        suggestions.push({
          action: "Schedule meeting",
          reason: daysSinceLastMeeting === null ? "No meeting has been held with this contact yet." : `It's been ${daysSinceLastMeeting} days since your last meeting.`,
        });
      } else if (daysSinceLastMeeting > 5) {
        suggestions.push({ action: "Follow up by email", reason: `It's been ${daysSinceLastMeeting} days since your last meeting — a quick check-in keeps momentum.` });
      }
      if (customer.tasks.length === 0) {
        suggestions.push({ action: "Call customer", reason: "There are no open tasks for this contact — a call would surface next steps." });
      }
      if (suggestions.length === 0) {
        suggestions.push({ action: "Follow up by email", reason: "Keep the relationship warm with a light-touch check-in." });
      }

      return { suggestions: suggestions.slice(0, 4) };
    },
  });

  await logAIUsage({
    organizationId: membership.organization.id,
    userId: membership.user.id,
    type: "TASK_SUGGESTIONS",
    model,
    input: { customerId },
    output: result,
    tokensUsed,
    relatedCustomerId: customerId,
  });

  return { ok: true, data: result };
}
