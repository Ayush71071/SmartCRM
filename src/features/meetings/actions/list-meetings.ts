import "server-only";
import { db } from "@/lib/db";

export async function listMeetingsForViews(organizationId: string) {
  const [meetings, members, customers] = await Promise.all([
    db.meeting.findMany({
      where: { organizationId },
      include: {
        customer: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
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

  return { meetings, members: members.map((m) => m.user), customers };
}

export type MeetingListItem = Awaited<ReturnType<typeof listMeetingsForViews>>["meetings"][number];
