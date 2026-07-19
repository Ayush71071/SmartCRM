"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { generateStructured } from "@/lib/openai";
import { logAIUsage } from "@/lib/ai-log";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type SummaryResult = { summary: string; actionItems: string[]; risks: string[]; nextSteps: string[] };

export async function summarizeMeetingAction(
  meetingId: string,
  transcript: string
): Promise<ActionResult<SummaryResult>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!transcript.trim()) return { ok: false, error: "Paste a transcript first." };

  const meeting = await db.meeting.findFirst({ where: { id: meetingId, organizationId: membership.organization.id } });
  if (!meeting) return { ok: false, error: "Meeting not found." };

  const { result, model, tokensUsed } = await generateStructured<SummaryResult>({
    system:
      "You are a sales operations assistant. Read the meeting transcript and respond as JSON: " +
      '{"summary": string, "actionItems": string[], "risks": string[], "nextSteps": string[]}. ' +
      "Keep the summary to 2-3 sentences. Each array should have at most 5 short items. If there are no risks, return an empty array.",
    user: transcript,
    mock: () => {
      const sentences = transcript
        .replace(/\n/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const summary = sentences.slice(0, 2).join(" ") || "No summary available.";

      const findLines = (keywords: string[]) =>
        sentences.filter((s) => keywords.some((k) => s.toLowerCase().includes(k))).slice(0, 5);

      const actionItems = findLines(["will ", "action", "need to", "should", "todo"]);
      const risks = findLines(["risk", "concern", "issue", "blocker", "worried", "problem"]);
      const nextSteps = findLines(["next", "follow up", "follow-up", "schedule", "send over"]);

      return {
        summary,
        actionItems: actionItems.length > 0 ? actionItems : ["No specific action items detected — review the transcript manually."],
        risks,
        nextSteps: nextSteps.length > 0 ? nextSteps : ["Schedule a follow-up to confirm next steps."],
      };
    },
  });

  await db.meeting.update({
    where: { id: meetingId },
    data: {
      transcript,
      aiSummary: result.summary,
      aiActionItems: result.actionItems,
      aiRisks: result.risks,
      aiNextSteps: result.nextSteps,
    },
  });

  await logAIUsage({
    organizationId: membership.organization.id,
    userId: membership.user.id,
    type: "MEETING_SUMMARY",
    model,
    input: { meetingId, transcriptLength: transcript.length },
    output: result,
    tokensUsed,
    relatedMeetingId: meetingId,
  });

  revalidatePath("/meetings");
  revalidatePath("/ai");
  return { ok: true, data: result };
}
