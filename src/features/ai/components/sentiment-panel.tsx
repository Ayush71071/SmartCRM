"use client";

import * as React from "react";
import { Loader2, Smile } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { analyzeSentimentAction } from "@/features/ai/actions/analyze-sentiment";

type CustomerOption = { id: string; name: string; company: string | null };

const SENTIMENT_VARIANT: Record<string, "success" | "secondary" | "destructive"> = {
  POSITIVE: "success",
  NEUTRAL: "secondary",
  NEGATIVE: "destructive",
};

export function SentimentPanel({ customers }: { customers: CustomerOption[] }) {
  const [customerId, setCustomerId] = React.useState(customers[0]?.id ?? "");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ sentiment: string; reasoning: string } | null>(null);

  async function handleAnalyze() {
    if (!customerId) return;
    setLoading(true);
    const res = await analyzeSentimentAction(customerId);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResult(res.data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile className="size-4" />
          AI Customer Sentiment
        </CardTitle>
        <CardDescription>Classify the tone of a customer&apos;s notes as positive, neutral or negative.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a customer first.</p>
        ) : (
          <>
            <Select
              value={customerId}
              onValueChange={(v) => {
                setCustomerId(v);
                setResult(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` · ${c.company}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAnalyze} disabled={loading} className="w-full">
              {loading && <Loader2 className="animate-spin" />}
              Analyze sentiment
            </Button>

            {result && (
              <div className="space-y-1.5 rounded-lg border p-3">
                <Badge variant={SENTIMENT_VARIANT[result.sentiment] ?? "secondary"}>{result.sentiment}</Badge>
                <p className="text-sm text-muted-foreground">{result.reasoning}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
