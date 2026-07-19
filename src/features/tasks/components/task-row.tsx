"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityBadge } from "@/features/tasks/components/task-priority-badge";
import { TaskFormSheet } from "@/features/tasks/components/task-form-sheet";
import { DeleteButton } from "@/components/shared/delete-button";
import { toggleTaskComplete, deleteTask } from "@/features/tasks/actions/task-actions";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { TaskListItem } from "@/features/tasks/actions/list-tasks";

type Member = { id: string; name: string };
type CustomerOption = { id: string; name: string };

export function TaskRow({
  task,
  members,
  customers,
}: {
  task: TaskListItem;
  members: Member[];
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const [toggling, setToggling] = React.useState(false);

  const isOverdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date(new Date().toDateString());

  async function handleToggle() {
    setToggling(true);
    const result = await toggleTaskComplete(task.id);
    setToggling(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Checkbox checked={task.status === "DONE"} disabled={toggling} onCheckedChange={handleToggle} />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", task.status === "DONE" && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className={cn(isOverdue && "font-medium text-destructive")}>{formatDate(task.dueDate)}</span>
          )}
          {task.recurrence !== "NONE" && <Repeat className="size-3" />}
          {task.customer && <span>· {task.customer.name}</span>}
          {task.assignedTo && <span>· {task.assignedTo.name}</span>}
        </div>
      </div>
      <TaskPriorityBadge priority={task.priority} />
      {isOverdue && <Badge variant="destructive">Overdue</Badge>}
      <TaskFormSheet
        members={members}
        customers={customers}
        existing={{
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          priority: task.priority,
          recurrence: task.recurrence,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
          assignedToId: task.assignedToId ?? "",
          customerId: task.customerId ?? "",
        }}
      />
      <DeleteButton action={deleteTask.bind(null, task.id)} confirmMessage={`Delete "${task.title}"?`} label="" />
    </div>
  );
}
