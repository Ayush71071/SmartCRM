"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CustomerGrowthChart({ data }: { data: { month: string; customers: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
        <Tooltip
          formatter={(value: number) => [value, "Total customers"]}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="customers"
          stroke="var(--color-chart-3)"
          strokeWidth={2}
          fill="url(#growthFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
