"use client";

import * as React from "react";
import { Loader2, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSalesInsightsAction } from "@/features/ai/actions/sales-insights";

type Insights = {
  topOpportunities: string[];
  weakAreas: string[];
  recommendations: string[];
  revenuePrediction: string;
};

function InsightList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="list-disc space-y-0.5 pl-4 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function SalesInsightsPanel() {
  const [loading, setLoading] = React.useState(false);
  const [insights, setInsights] = React.useState<Insights | null>(null);

  async function handleGenerate() {
    setLoading(true);
    const res = await getSalesInsightsAction();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setInsights(res.data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4" />
          AI Sales Insights
        </CardTitle>
        <CardDescription>Top opportunities, weak pipeline areas, recommendations and a revenue forecast.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Generate insights
        </Button>

        {insights && (
          <div className="space-y-3 rounded-lg border p-3">
            <InsightList title="Top opportunities" items={insights.topOpportunities} />
            <InsightList title="Weak pipeline areas" items={insights.weakAreas} />
            <InsightList title="Recommendations" items={insights.recommendations} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Revenue prediction</p>
              <p className="text-sm">{insights.revenuePrediction}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
