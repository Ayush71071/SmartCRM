import { CheckSquare } from "lucide-react";
import { TaskRow } from "@/features/tasks/components/task-row";
import type { TaskListItem } from "@/features/tasks/actions/list-tasks";

type Member = { id: string; name: string };
type CustomerOption = { id: string; name: string };

export function TaskListView({
  tasks,
  members,
  customers,
}: {
  tasks: TaskListItem[];
  members: Member[];
  customers: CustomerOption[];
}) {
  const todo = tasks.filter((t) => t.status !== "DONE");
  const done = tasks.filter((t) => t.status === "DONE");

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-14 text-center">
        <CheckSquare className="size-8 text-muted-foreground" />
        <p className="font-medium">No tasks yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">Create your first task to start tracking work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">To do ({todo.length})</h2>
        {todo.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing outstanding — nice work.</p>
        ) : (
          <div className="space-y-2">
            {todo.map((task) => (
              <TaskRow key={task.id} task={task} members={members} customers={customers} />
            ))}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Done ({done.length})</h2>
          <div className="space-y-2">
            {done.map((task) => (
              <TaskRow key={task.id} task={task} members={members} customers={customers} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
