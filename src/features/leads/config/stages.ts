export const STAGE_CONFIG: Record<string, { label: string; dot: string }> = {
  NEW: { label: "New", dot: "bg-[var(--color-chart-1)]" },
  CONTACTED: { label: "Contacted", dot: "bg-[var(--color-chart-2)]" },
  QUALIFIED: { label: "Qualified", dot: "bg-[var(--color-chart-3)]" },
  PROPOSAL: { label: "Proposal", dot: "bg-[var(--color-chart-4)]" },
  NEGOTIATION: { label: "Negotiation", dot: "bg-[var(--color-chart-5)]" },
  WON: { label: "Won", dot: "bg-success" },
  LOST: { label: "Lost", dot: "bg-destructive" },
};
