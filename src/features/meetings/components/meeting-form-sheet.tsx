"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { meetingSchema, type MeetingInput } from "@/features/meetings/schemas/meeting-schemas";
import { createMeeting, updateMeeting } from "@/features/meetings/actions/meeting-actions";

type Member = { id: string; name: string };
type CustomerOption = { id: string; name: string };
type ExistingMeeting = MeetingInput & { id: string };

export function MeetingFormSheet({
  members,
  customers,
  existing,
}: {
  members: Member[];
  customers: CustomerOption[];
  existing?: ExistingMeeting;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MeetingInput>({
    resolver: zodResolver(meetingSchema),
    defaultValues: existing ?? {
      title: "",
      scheduledAt: "",
      durationMinutes: 30,
      location: "",
      customerId: "",
      notes: "",
      attendeeUserIds: [],
      externalAttendees: "",
    },
  });

  async function onSubmit(data: MeetingInput) {
    setSubmitting(true);
    const result = existing ? await updateMeeting(existing.id, data) : await createMeeting(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(existing ? "Meeting updated." : "Meeting scheduled.");
    setOpen(false);
    if (!existing) reset();
    router.refresh();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && existing) reset(existing);
      }}
    >
      <SheetTrigger asChild>
        {existing ? (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        ) : (
          <Button>
            <Plus />
            Schedule meeting
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{existing ? "Edit meeting" : "Schedule a meeting"}</SheetTitle>
          <SheetDescription>{existing ? "Update this meeting." : "Add a new meeting to your calendar."}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 px-1">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt">Date &amp; time *</Label>
              <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
              {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationMinutes">Duration (min)</Label>
              <Input id="durationMinutes" type="number" min={5} step={5} {...register("durationMinutes")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location / link</Label>
            <Input id="location" placeholder="Zoom link or office address" {...register("location")} />
          </div>

          <div className="space-y-1.5">
            <Label>Related customer</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Attendees (team)</Label>
            <Controller
              control={control}
              name="attendeeUserIds"
              render={({ field }) => (
                <div className="space-y-2 rounded-md border p-2.5">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value.includes(m.id)}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? [...field.value, m.id] : field.value.filter((id) => id !== m.id))
                        }
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="externalAttendees">External attendees (emails)</Label>
            <Input id="externalAttendees" placeholder="jane@client.com, sam@client.com" {...register("externalAttendees")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Agenda / notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="animate-spin" />}
            {existing ? "Save changes" : "Schedule meeting"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
