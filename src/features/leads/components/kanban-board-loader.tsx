"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// dnd-kit assigns internal ids (e.g. aria-describedby="DndDescribedBy-N")
// from a module-level counter that increments differently on the server vs.
// the client, which causes a hydration mismatch if this ever renders during
// SSR. Loading it client-only sidesteps that entirely.
export const KanbanBoardClientOnly = dynamic(
  () => import("@/features/leads/components/kanban-board").then((m) => m.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-xl" />
        ))}
      </div>
    ),
  }
);
