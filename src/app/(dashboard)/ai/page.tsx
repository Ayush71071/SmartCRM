import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { getCurrentMembership } from "@/lib/current-membership";
import { getAIPageData } from "@/features/ai/actions/get-ai-page-data";
import { isAIConfigured } from "@/lib/openai";
import { LeadScoringPanel } from "@/features/ai/components/lead-scoring-panel";
import { EmailGeneratorPanel } from "@/features/ai/components/email-generator-panel";
import { MeetingSummaryPanel } from "@/features/ai/components/meeting-summary-panel";
import { SalesInsightsPanel } from "@/features/ai/components/sales-insights-panel";
import { SentimentPanel } from "@/features/ai/components/sentiment-panel";
import { TaskSuggestionsPanel } from "@/features/ai/components/task-suggestions-panel";

export const dynamic = "force-dynamic";

export default async function AIToolsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { leads, customers, meetings } = await getAIPageData(membership.organization.id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Tools</h1>
        <p className="text-sm text-muted-foreground">AI-powered lead scoring, email drafting, meeting summaries, insights and more.</p>
      </div>

      {!isAIConfigured && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" />
          No <code className="rounded bg-muted px-1">OPENAI_API_KEY</code> configured — these tools are running in mock
          mode with heuristic results computed from your real data. Add a key in .env to use live GPT-4o mini.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeadScoringPanel leads={leads} />
        <EmailGeneratorPanel customers={customers} />
        <MeetingSummaryPanel meetings={meetings} />
        <SalesInsightsPanel />
        <SentimentPanel customers={customers} />
        <TaskSuggestionsPanel customers={customers} />
      </div>
    </div>
  );
}
