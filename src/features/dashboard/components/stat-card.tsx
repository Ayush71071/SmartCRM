import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "brand" | "success" | "warning";
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accent === "brand" && "bg-brand/15 text-brand",
            accent === "success" && "bg-success/15 text-success",
            accent === "warning" && "bg-warning/15 text-warning",
            !accent && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
