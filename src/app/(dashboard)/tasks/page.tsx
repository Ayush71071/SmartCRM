import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/current-membership";
import { listTasksForViews } from "@/features/tasks/actions/list-tasks";
import { TaskFormSheet } from "@/features/tasks/components/task-form-sheet";
import { TaskListView } from "@/features/tasks/components/task-list-view";
import { TaskCalendarView } from "@/features/tasks/components/task-calendar-view";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { tasks, members, customers } = await listTasksForViews(membership.organization.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">{tasks.filter((t) => t.status !== "DONE").length} outstanding</p>
        </div>
        <TaskFormSheet members={members} customers={customers} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <TaskListView tasks={tasks} members={members} customers={customers} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <TaskCalendarView tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
