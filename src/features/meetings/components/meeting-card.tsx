"use client";

import Link from "next/link";
import { Clock, MapPin, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { MeetingFormSheet } from "@/features/meetings/components/meeting-form-sheet";
import { deleteMeeting, markMeetingCompleted } from "@/features/meetings/actions/meeting-actions";
import { formatDateTime } from "@/lib/format-date";
import type { MeetingListItem } from "@/features/meetings/actions/list-meetings";

type Member = { id: string; name: string };
type CustomerOption = { id: string; name: string };

export function MeetingCard({
  meeting,
  members,
  customers,
}: {
  meeting: MeetingListItem;
  members: Member[];
  customers: CustomerOption[];
}) {
  const router = useRouter();

  const internalAttendees = meeting.attendees.filter((a) => a.user).map((a) => a.user!.name);
  const externalAttendees = meeting.attendees.filter((a) => a.externalEmail).map((a) => a.externalEmail!);

  async function handleComplete() {
    const result = await markMeetingCompleted(meeting.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{meeting.title}</p>
            {meeting.customer && (
              <Link href={`/customers/${meeting.customer.id}`} className="text-xs text-muted-foreground hover:underline">
                {meeting.customer.name}
              </Link>
            )}
          </div>
          <Badge variant={meeting.status === "COMPLETED" ? "success" : meeting.status === "CANCELLED" ? "secondary" : "brand"}>
            {meeting.status === "COMPLETED" ? "Completed" : meeting.status === "CANCELLED" ? "Cancelled" : "Scheduled"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDateTime(meeting.scheduledAt)} · {meeting.durationMinutes}m
          </span>
          {meeting.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {meeting.location}
            </span>
          )}
          {(internalAttendees.length > 0 || externalAttendees.length > 0) && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {[...internalAttendees, ...externalAttendees].join(", ")}
            </span>
          )}
        </div>

        {meeting.notes && <p className="text-sm text-muted-foreground">{meeting.notes}</p>}

        <div className="flex items-center gap-2 pt-1">
          {meeting.status === "SCHEDULED" && (
            <Button variant="outline" size="sm" onClick={handleComplete}>
              <CheckCircle2 />
              Mark completed
            </Button>
          )}
          <MeetingFormSheet
            members={members}
            customers={customers}
            existing={{
              id: meeting.id,
              title: meeting.title,
              scheduledAt: new Date(meeting.scheduledAt).toISOString().slice(0, 16),
              durationMinutes: meeting.durationMinutes,
              location: meeting.location ?? "",
              customerId: meeting.customerId ?? "",
              notes: meeting.notes ?? "",
              attendeeUserIds: meeting.attendees.filter((a) => a.userId).map((a) => a.userId!),
              externalAttendees: externalAttendees.join(", "),
            }}
          />
          <DeleteButton action={deleteMeeting.bind(null, meeting.id)} confirmMessage={`Delete "${meeting.title}"?`} label="" />
        </div>
      </CardContent>
    </Card>
  );
}
