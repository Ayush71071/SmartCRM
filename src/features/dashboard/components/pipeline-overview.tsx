import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/format";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

const STAGE_DOT: Record<string, string> = {
  NEW: "bg-[var(--color-chart-1)]",
  CONTACTED: "bg-[var(--color-chart-2)]",
  QUALIFIED: "bg-[var(--color-chart-3)]",
  PROPOSAL: "bg-[var(--color-chart-4)]",
  NEGOTIATION: "bg-[var(--color-chart-5)]",
  WON: "bg-success",
  LOST: "bg-destructive",
};

export function PipelineOverview({
  pipeline,
}: {
  pipeline: { stage: string; count: number; value: number }[];
}) {
  const totalOpenValue = pipeline
    .filter((p) => p.stage !== "WON" && p.stage !== "LOST")
    .reduce((sum, p) => sum + p.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline overview</CardTitle>
        <CardDescription>{formatMoney(totalOpenValue)} in open pipeline value</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {pipeline.map((p) => (
          <div key={p.stage} className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-1.5 rounded-full ${STAGE_DOT[p.stage]}`} />
              {STAGE_LABELS[p.stage] ?? p.stage}
            </div>
            <p className="mt-1.5 text-lg font-semibold">{formatNumber(p.count)}</p>
            <p className="text-xs text-muted-foreground">{formatMoney(p.value, { compact: true })}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
