"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SalesTrendChart({ data }: { data: { month: string; deals: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -20, right: 12, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
        <Tooltip
          formatter={(value: number) => [value, "Deals won"]}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="deals"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-chart-2)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
