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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { leadSchema, leadStageValues, type LeadInput } from "@/features/leads/schemas/lead-schemas";
import { createLead } from "@/features/leads/actions/lead-actions";
import { STAGE_CONFIG } from "@/features/leads/config/stages";
import type { BoardCustomer, BoardMember } from "@/features/leads/actions/get-board-data";

export function LeadFormSheet({ customers, members }: { customers: BoardCustomer[]; members: BoardMember[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { customerId: "", stage: "NEW", value: 5000, probability: 20, notes: "", source: "" },
  });

  async function onSubmit(data: LeadInput) {
    setSubmitting(true);
    const result = await createLead(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Lead created.");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus />
          New lead
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New lead</SheetTitle>
          <SheetDescription>Add a new opportunity to the pipeline.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 px-1">
          <div className="space-y-1.5">
            <Label>Contact *</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` · ${c.company}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Controller
              control={control}
              name="stage"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStageValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STAGE_CONFIG[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value">Deal value (USD)</Label>
              <Input id="value" type="number" min={0} step={100} {...register("value")} />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input id="probability" type="number" min={0} max={100} {...register("probability")} />
              {errors.probability && <p className="text-xs text-destructive">{errors.probability.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned employee</Label>
            <Controller
              control={control}
              name="assignedToId"
              render={({ field }) => (
                <Select value={field.value || "unassigned"} onValueChange={(v) => field.onChange(v === "unassigned" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Input id="source" placeholder="e.g. Referral, Cold outreach" {...register("source")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="animate-spin" />}
            Create lead
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
