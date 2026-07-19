"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "var(--color-chart-1)",
  CONTACTED: "var(--color-chart-2)",
  QUALIFIED: "var(--color-chart-3)",
  PROPOSAL: "var(--color-chart-4)",
  NEGOTIATION: "var(--color-chart-5)",
  WON: "var(--color-success)",
  LOST: "var(--color-destructive)",
};

export function ConversionChart({ data }: { data: { stage: string; count: number }[] }) {
  const chartData = data.map((d) => ({ ...d, label: STAGE_LABELS[d.stage] ?? d.stage }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} fontSize={12} width={80} />
        <Tooltip
          formatter={(value: number) => [value, "Leads"]}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? "var(--color-chart-1)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
