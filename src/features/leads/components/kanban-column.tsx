"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { STAGE_CONFIG } from "@/features/leads/config/stages";
import { LeadCard } from "@/features/leads/components/lead-card";
import { formatMoney } from "@/lib/format";
import type { BoardLead } from "@/features/leads/actions/get-board-data";

export function KanbanColumn({ stage, leads }: { stage: string; leads: BoardLead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const config = STAGE_CONFIG[stage] ?? { label: stage, dot: "bg-muted-foreground" };
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0) / 100;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`size-2 rounded-full ${config.dot}`} />
          {config.label}
          <span className="text-muted-foreground">{leads.length}</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatMoney(totalValue, { compact: true })}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-b-xl p-2 pt-0 transition-colors ${
          isOver ? "bg-accent" : ""
        }`}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
