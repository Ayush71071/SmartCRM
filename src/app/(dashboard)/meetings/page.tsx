import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { getCurrentMembership } from "@/lib/current-membership";
import { listMeetingsForViews } from "@/features/meetings/actions/list-meetings";
import { MeetingFormSheet } from "@/features/meetings/components/meeting-form-sheet";
import { MeetingCard } from "@/features/meetings/components/meeting-card";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { meetings, members, customers } = await listMeetingsForViews(membership.organization.id);
  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduledAt) >= now && m.status !== "CANCELLED");
  const past = meetings.filter((m) => !upcoming.includes(m));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground">{upcoming.length} upcoming</p>
        </div>
        <MeetingFormSheet members={members} customers={customers} />
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-14 text-center">
          <CalendarDays className="size-8 text-muted-foreground" />
          <p className="font-medium">No meetings scheduled</p>
          <p className="max-w-sm text-sm text-muted-foreground">Schedule your first meeting to see it here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Upcoming ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((m) => (
                  <MeetingCard key={m.id} meeting={m} members={members} customers={customers} />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Past ({past.length})</h2>
              <div className="space-y-3">
                {past.map((m) => (
                  <MeetingCard key={m.id} meeting={m} members={members} customers={customers} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
