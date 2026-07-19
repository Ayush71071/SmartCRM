"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskListItem } from "@/features/tasks/actions/list-tasks";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskCalendarView({ tasks }: { tasks: TaskListItem[] }) {
  const [month, setMonth] = React.useState(() => new Date());

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = React.useMemo(() => {
    const map = new Map<string, TaskListItem[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="font-medium">{format(month, "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r p-1.5 last:border-r-0",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs",
                  isToday(day) && "bg-brand font-semibold text-brand-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-1 truncate rounded bg-muted px-1 py-0.5 text-[11px]">
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[11px] text-muted-foreground">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
