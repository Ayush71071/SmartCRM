"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { logActivity } from "@/lib/activity";
import { canManageRecord, canCreateRecords } from "@/lib/rbac";
import { meetingSchema, type MeetingInput } from "@/features/meetings/schemas/meeting-schemas";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function parseExternalEmails(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

function isOwner(userId: string, meeting: { createdById: string }) {
  return meeting.createdById === userId;
}

export async function createMeeting(input: MeetingInput): Promise<ActionResult<{ id: string }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };
  if (!canCreateRecords(membership.role)) return { ok: false, error: "You don't have permission to schedule meetings." };

  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const externalEmails = parseExternalEmails(parsed.data.externalAttendees);

  const meeting = await db.meeting.create({
    data: {
      organizationId: membership.organization.id,
      title: parsed.data.title,
      scheduledAt: new Date(parsed.data.scheduledAt),
      durationMinutes: parsed.data.durationMinutes,
      location: parsed.data.location,
      customerId: parsed.data.customerId || null,
      notes: parsed.data.notes,
      createdById: membership.user.id,
      attendees: {
        create: [
          ...parsed.data.attendeeUserIds.map((userId) => ({ userId })),
          ...externalEmails.map((email) => ({ externalEmail: email })),
        ],
      },
    },
  });

  if (parsed.data.customerId) {
    await logActivity({
      organizationId: membership.organization.id,
      type: "MEETING",
      description: `${membership.user.name} scheduled a meeting: ${parsed.data.title}.`,
      actorId: membership.user.id,
      customerId: parsed.data.customerId,
      meetingId: meeting.id,
    });
  }

  revalidatePath("/meetings");
  return { ok: true, data: { id: meeting.id } };
}

export async function updateMeeting(id: string, input: MeetingInput): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.meeting.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Meeting not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, existing))) {
    return { ok: false, error: "You don't have permission to edit this meeting." };
  }

  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const externalEmails = parseExternalEmails(parsed.data.externalAttendees);

  await db.$transaction([
    db.meetingAttendee.deleteMany({ where: { meetingId: id } }),
    db.meeting.update({
      where: { id },
      data: {
        title: parsed.data.title,
        scheduledAt: new Date(parsed.data.scheduledAt),
        durationMinutes: parsed.data.durationMinutes,
        location: parsed.data.location,
        customerId: parsed.data.customerId || null,
        notes: parsed.data.notes,
        attendees: {
          create: [
            ...parsed.data.attendeeUserIds.map((userId) => ({ userId })),
            ...externalEmails.map((email) => ({ externalEmail: email })),
          ],
        },
      },
    }),
  ]);

  revalidatePath("/meetings");
  return { ok: true, data: undefined };
}

export async function deleteMeeting(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.meeting.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Meeting not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, existing))) {
    return { ok: false, error: "You don't have permission to delete this meeting." };
  }

  await db.meeting.delete({ where: { id } });
  revalidatePath("/meetings");
  return { ok: true, data: undefined };
}

export async function markMeetingCompleted(id: string): Promise<ActionResult<undefined>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const existing = await db.meeting.findFirst({ where: { id, organizationId: membership.organization.id } });
  if (!existing) return { ok: false, error: "Meeting not found." };
  if (!canManageRecord(membership.role, isOwner(membership.user.id, existing))) {
    return { ok: false, error: "You don't have permission to update this meeting." };
  }

  await db.meeting.update({ where: { id }, data: { status: "COMPLETED" } });
  revalidatePath("/meetings");
  return { ok: true, data: undefined };
}
