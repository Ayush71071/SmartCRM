"use server";

import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths } from "date-fns";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { logActivity } from "@/lib/activity";
import { canManageRecord, canCreateRecords } from "@/lib/rbac";
import { verifyMembersInOrg } from "@/lib/tenant-guard";
import { taskSchema, type TaskInput } from "@/features/tasks/schemas/task-schemas";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function isOwner(userId: string, task: { assignedToId: string | null; createdById: string }) {
  return task.assignedToId === userId || task.createdById === userId;
}

/** Verifies client-supplied customerId/assignedToId references actually belong to this org. */
async function verifyTaskReferences(
  organizationId: string,
  data: Pick<TaskInput, "customerId" | "assignedToId">
): Promise<string | null> {
  if (data.customerId) {
    const customer = await db.customer.findFirst({ where: { id: data.customerId, organizationId } });
    if (!customer) return "Customer not found.";
  }
  if (data.assignedToId && !(await verifyMembersInOrg(organizationId, [data.assignedToId]))) {
    return "Assignee not found.";
  }
  return null;
}

function nextDueDate(from: Date, recurrence: string): Date | null {
  switch (recurrence) {
    case "DAILY":
      return addDays(from, 1);
    case "WEEKLY":
      return addWeeks(from, 1);
    case "MONTHLY":
      return addMonths(from, 1);
    default:
      return null;
  }
}

export async function createTask(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to create tasks." };

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const referenceError = await verifyTaskReferences(membership.organization.id, parsed.data);
  if (referenceError) return { ok: false, error: referenceError };

  const task = await db.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      recurrence: parsed.data.recurrence,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assignedToId: parsed.data.assignedToId || null,
      customerId: parsed.data.customerId || null,
      organizationId: membership.organization.id,
      createdById: membership.user.id,
    },
  });

  revalidatePath("/tasks");
  return { ok: true, data: { id: task.id } };
}

export async function updateTask(id: string, input: TaskInput): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.task.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Task not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, existing))) {
    return { ok: false, error: "You don't have permission to edit this task." };
  }

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const referenceError = await verifyTaskReferences(membership.organization.id, parsed.data);
  if (referenceError) return { ok: false, error: referenceError };

  await db.task.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      recurrence: parsed.data.recurrence,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assignedToId: parsed.data.assignedToId || null,
      customerId: parsed.data.customerId || null,
    },
  });

  revalidatePath("/tasks");
  return { ok: true, data: undefined };
}

export async function deleteTask(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.task.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Task not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, existing))) {
    return { ok: false, error: "You don't have permission to delete this task." };
  }

  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  return { ok: true, data: undefined };
}

/**
 * Toggles TODO <-> DONE. Completing a recurring task also schedules its next
 * occurrence (a fresh TODO task with the due date advanced by the recurrence
 * interval), which is a simpler and more transparent model than a background
 * job silently materializing future instances ahead of time.
 */
export async function toggleTaskComplete(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const task = await db.task.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!task) return { ok: false, error: "Task not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, task))) {
    return { ok: false, error: "You don't have permission to update this task." };
  }

  const completing = task.status !== "DONE";

  await db.task.update({
    where: { id },
    data: { status: completing ? "DONE" : "TODO", completedAt: completing ? new Date() : null },
  });

  if (completing) {
    await logActivity({
      organizationId: membership.organization.id,
      type: "TASK",
      description: `${membership.user.name} completed the task "${task.title}".`,
      actorId: membership.user.id,
      taskId: task.id,
      customerId: task.customerId ?? undefined,
    });

    if (task.recurrence !== "NONE") {
      const base = task.dueDate ?? new Date();
      const next = nextDueDate(base, task.recurrence);
      if (next) {
        await db.task.create({
          data: {
            organizationId: membership.organization.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            recurrence: task.recurrence,
            recurrenceInterval: task.recurrenceInterval,
            dueDate: next,
            assignedToId: task.assignedToId,
            customerId: task.customerId,
            leadId: task.leadId,
            dealId: task.dealId,
            createdById: membership.user.id,
          },
        });
      }
    }
  }

  revalidatePath("/tasks");
  return { ok: true, data: undefined };
}
