"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarClock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { summarizeMeetingAction } from "@/features/ai/actions/summarize-meeting";

type MeetingOption = {
  id: string;
  title: string;
  transcript: string | null;
  aiSummary: string | null;
  aiActionItems: unknown;
  aiRisks: unknown;
  aiNextSteps: unknown;
  customer: { name: string } | null;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function MeetingSummaryPanel({ meetings }: { meetings: MeetingOption[] }) {
  const router = useRouter();
  const [meetingId, setMeetingId] = React.useState(meetings[0]?.id ?? "");
  const [transcript, setTranscript] = React.useState(meetings[0]?.transcript ?? "");
  const [loading, setLoading] = React.useState(false);

  const selected = meetings.find((m) => m.id === meetingId);
  const [result, setResult] = React.useState<{
    summary: string;
    actionItems: string[];
    risks: string[];
    nextSteps: string[];
  } | null>(
    selected?.aiSummary
      ? {
          summary: selected.aiSummary,
          actionItems: asStringArray(selected.aiActionItems),
          risks: asStringArray(selected.aiRisks),
          nextSteps: asStringArray(selected.aiNextSteps),
        }
      : null
  );

  function handleSelectMeeting(id: string) {
    setMeetingId(id);
    const m = meetings.find((mm) => mm.id === id);
    setTranscript(m?.transcript ?? "");
    setResult(
      m?.aiSummary
        ? { summary: m.aiSummary, actionItems: asStringArray(m.aiActionItems), risks: asStringArray(m.aiRisks), nextSteps: asStringArray(m.aiNextSteps) }
        : null
    );
  }

  async function handleSummarize() {
    if (!meetingId) return;
    setLoading(true);
    const res = await summarizeMeetingAction(meetingId, transcript);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResult(res.data);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4" />
          AI Meeting Summary
        </CardTitle>
        <CardDescription>Paste a transcript to get a summary, action items, risks and next steps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Schedule a meeting first.</p>
        ) : (
          <>
            <Select value={meetingId} onValueChange={handleSelectMeeting}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meetings.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                    {m.customer ? ` · ${m.customer.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              rows={5}
              placeholder="Paste the meeting transcript here…"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />

            <Button onClick={handleSummarize} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Summarize
            </Button>

            {result && (
              <div className="space-y-3 rounded-lg border p-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Summary</p>
                  <p>{result.summary}</p>
                </div>
                {result.actionItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Action items</p>
                    <ul className="list-disc space-y-0.5 pl-4">
                      {result.actionItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.risks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Risks</p>
                    <ul className="list-disc space-y-0.5 pl-4">
                      {result.risks.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.nextSteps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Next steps</p>
                    <ul className="list-disc space-y-0.5 pl-4">
                      {result.nextSteps.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
