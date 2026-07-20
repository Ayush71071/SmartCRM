"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Building2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { LeadFormSheet } from "@/features/leads/components/lead-form-sheet";
import { deleteLead } from "@/features/leads/actions/lead-actions";
import { formatMoney } from "@/lib/format";
import type { BoardLead, BoardCustomer, BoardMember } from "@/features/leads/actions/get-board-data";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function LeadCard({
  lead,
  customers,
  members,
}: {
  lead: BoardLead;
  customers: BoardCustomer[];
  members: BoardMember[];
}) {
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
          <div className="flex items-start justify-between gap-1">
            <Link
              href={`/customers/${lead.customer.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block min-w-0 truncate text-sm font-medium hover:underline"
            >
              {lead.customer.name}
            </Link>
            {/* Stop propagation so these controls don't get swallowed by the
                card's own dnd-kit drag listeners. */}
            <div
              className="flex shrink-0 items-center gap-0.5"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <LeadFormSheet
                customers={customers}
                members={members}
                existing={{
                  id: lead.id,
                  customerId: lead.customerId,
                  stage: lead.stage,
                  value: lead.value / 100,
                  probability: lead.probability,
                  notes: lead.notes ?? "",
                  assignedToId: lead.assignedToId ?? "",
                  source: lead.source ?? "",
                }}
                trigger={
                  <Button variant="ghost" size="icon" className="size-6">
                    <Pencil className="size-3.5" />
                  </Button>
                }
              />
              <DeleteButton
                action={deleteLead.bind(null, lead.id)}
                confirmMessage={`Delete this lead for ${lead.customer.name}?`}
                label=""
                size="icon"
              />
            </div>
          </div>
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
