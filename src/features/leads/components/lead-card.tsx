"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import type { BoardLead } from "@/features/leads/actions/get-board-data";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function LeadCard({ lead }: { lead: BoardLead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { stage: lead.stage },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-40" : ""}
    >
      <Card className="cursor-grab gap-0 py-0 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
        <CardContent className="space-y-2 p-3">
          <Link
            href={`/customers/${lead.customer.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-sm font-medium hover:underline"
          >
            {lead.customer.name}
          </Link>
          {lead.customer.company && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Building2 className="size-3 shrink-0" />
              {lead.customer.company}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold">{formatMoney(lead.value / 100, { compact: true })}</span>
            <Badge variant="outline">{lead.probability}%</Badge>
          </div>
          {lead.assignedTo && (
            <div className="flex items-center gap-1.5 pt-1">
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]">{initials(lead.assignedTo.name)}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-muted-foreground">{lead.assignedTo.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
