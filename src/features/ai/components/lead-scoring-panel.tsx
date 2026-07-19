"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { scoreLeadAction } from "@/features/ai/actions/score-lead";

type LeadOption = {
  id: string;
  stage: string;
  value: number;
  score: number | null;
  scoreReason: string | null;
  customer: { name: string; company: string | null };
};

export function LeadScoringPanel({ leads }: { leads: LeadOption[] }) {
  const router = useRouter();
  const [leadId, setLeadId] = React.useState(leads[0]?.id ?? "");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ score: number; reason: string } | null>(null);

  const selected = leads.find((l) => l.id === leadId);

  async function handleScore() {
    if (!leadId) return;
    setLoading(true);
    const res = await scoreLeadAction(leadId);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResult(res.data);
    router.refresh();
  }

  const displayed = result ?? (selected?.score !== null && selected?.score !== undefined ? { score: selected.score, reason: selected.scoreReason ?? "" } : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4" />
          AI Lead Scoring
        </CardTitle>
        <CardDescription>Automatically score how likely a lead is to close, with a plain-English reason.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active leads to score.</p>
        ) : (
          <>
            <Select
              value={leadId}
              onValueChange={(v) => {
                setLeadId(v);
                setResult(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.customer.company ?? l.customer.name} · {l.stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleScore} disabled={loading} className="w-full">
              {loading && <Loader2 className="animate-spin" />}
              Score this lead
            </Button>

            {displayed && (
              <div className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={displayed.score >= 70 ? "success" : displayed.score >= 40 ? "warning" : "destructive"}>
                    {displayed.score}/100
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{displayed.reason}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
