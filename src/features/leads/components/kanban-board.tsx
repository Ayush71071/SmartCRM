"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KanbanColumn } from "@/features/leads/components/kanban-column";
import { LeadCard } from "@/features/leads/components/lead-card";
import { leadStageValues } from "@/features/leads/schemas/lead-schemas";
import { moveLead } from "@/features/leads/actions/lead-actions";
import type { BoardLead, BoardCustomer, BoardMember } from "@/features/leads/actions/get-board-data";

type Columns = Record<string, BoardLead[]>;

export function KanbanBoard({
  initialColumns,
  customers,
  members,
}: {
  initialColumns: Columns;
  customers: BoardCustomer[];
  members: BoardMember[];
}) {
  const [columns, setColumns] = React.useState<Columns>(initialColumns);
  const [activeLead, setActiveLead] = React.useState<BoardLead | null>(null);

  // useState only seeds from initialColumns on first mount — without this,
  // a router.refresh() after creating/editing a lead elsewhere would fetch
  // fresh server data but the board would keep showing stale local state,
  // since this component doesn't remount when its props change.
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);
  const snapshotRef = React.useRef<Columns>(initialColumns);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function findContainer(id: string): string | undefined {
    if (id in columns) return id;
    return Object.keys(columns).find((stage) => columns[stage].some((l) => l.id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    snapshotRef.current = columns;
    const lead = Object.values(columns).flat().find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((l) => l.id === active.id);
      const overIndex = overItems.findIndex((l) => l.id === over.id);

      const movedLead = { ...activeItems[activeIndex], stage: overContainer as BoardLead["stage"] };
      const newActiveItems = activeItems.filter((l) => l.id !== active.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      const newOverItems = [...overItems.slice(0, insertAt), movedLead, ...overItems.slice(insertAt)];

      return { ...prev, [activeContainer]: newActiveItems, [overContainer]: newOverItems };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const container = findContainer(active.id as string);
    if (!container) return;

    const items = columns[container];
    const oldIndex = items.findIndex((l) => l.id === active.id);
    const newIndex = over.id in columns ? items.length - 1 : items.findIndex((l) => l.id === over.id);

    const reordered = oldIndex !== newIndex && newIndex >= 0 ? arrayMove(items, oldIndex, newIndex) : items;
    setColumns((prev) => ({ ...prev, [container]: reordered }));

    const result = await moveLead(
      active.id as string,
      container,
      reordered.map((l) => l.id)
    );

    if (!result.ok) {
      toast.error(result.error);
      setColumns(snapshotRef.current);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {leadStageValues.map((stage) => (
          <KanbanColumn key={stage} stage={stage} leads={columns[stage] ?? []} customers={customers} members={members} />
        ))}
      </div>
      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} customers={customers} members={members} />}
      </DragOverlay>
    </DndContext>
  );
}
