"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SentimentBreakdown } from "@/lib/types";

interface SentimentChartProps {
  sentiment: SentimentBreakdown;
}

const CONFIG: { key: keyof SentimentBreakdown; label: string; color: string }[] = [
  { key: "positive", label: "Positive", color: "var(--positive)" },
  { key: "neutral", label: "Neutral", color: "var(--neutral)" },
  { key: "negative", label: "Negative", color: "var(--negative)" },
];

export default function SentimentChart({ sentiment }: SentimentChartProps) {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  const data = CONFIG.map((c) => ({ name: c.label, key: c.key, value: sentiment[c.key], color: c.color }));

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center">
      <div className="h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={total > 0 ? 3 : 0}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} comments`, name]}
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--foreground)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-4">
        {data.map((entry) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div key={entry.key} className="flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="w-20 text-sm text-muted">{entry.name}</span>
              <span className="text-lg font-semibold text-foreground">{entry.value}</span>
              <span className="text-sm text-faint">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
