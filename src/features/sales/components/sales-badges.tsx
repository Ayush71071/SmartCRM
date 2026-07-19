import { Badge } from "@/components/ui/badge";

const INVOICE_CONFIG: Record<string, { label: string; variant: "secondary" | "brand" | "success" | "destructive" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SENT: { label: "Sent", variant: "brand" },
  PAID: { label: "Paid", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  VOID: { label: "Void", variant: "secondary" },
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const config = INVOICE_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const DEAL_CONFIG: Record<string, { label: string; variant: "brand" | "success" | "destructive" }> = {
  OPEN: { label: "Open", variant: "brand" },
  WON: { label: "Won", variant: "success" },
  LOST: { label: "Lost", variant: "destructive" },
};

export function DealStatusBadge({ status }: { status: string }) {
  const config = DEAL_CONFIG[status] ?? { label: status, variant: "brand" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
