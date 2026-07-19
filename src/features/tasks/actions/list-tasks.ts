import "server-only";
import { db } from "@/lib/db";

export async function listTasksForViews(organizationId: string) {
  const [tasks, members, customers] = await Promise.all([
    db.task.findMany({
      where: { organizationId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    db.membership.findMany({
      where: { organizationId },
      select: { user: { select: { id: true, name: true } } },
    }),
    db.customer.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { tasks, members: members.map((m) => m.user), customers };
}

export type TaskListItem = Awaited<ReturnType<typeof listTasksForViews>>["tasks"][number];
