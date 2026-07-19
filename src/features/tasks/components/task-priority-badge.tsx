import { Badge } from "@/components/ui/badge";

const PRIORITY_CONFIG: Record<string, { label: string; variant: "secondary" | "brand" | "warning" | "destructive" }> = {
  LOW: { label: "Low", variant: "secondary" },
  MEDIUM: { label: "Medium", variant: "brand" },
  HIGH: { label: "High", variant: "warning" },
  URGENT: { label: "Urgent", variant: "destructive" },
};

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] ?? { label: priority, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
