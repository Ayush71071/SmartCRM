import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "brand" | "success" | "secondary" | "destructive" }> = {
  LEAD: { label: "Lead", variant: "brand" },
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
  CHURNED: { label: "Churned", variant: "destructive" },
};

export function CustomerStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
