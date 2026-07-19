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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { dealSchema, type DealInput } from "@/features/sales/schemas/sales-schemas";
import { createDeal } from "@/features/sales/actions/deal-actions";

type CustomerOption = { id: string; name: string };

export function DealFormSheet({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DealInput>({
    resolver: zodResolver(dealSchema),
    defaultValues: { customerId: "", title: "", amount: 0, status: "OPEN" },
  });

  async function onSubmit(data: DealInput) {
    setSubmitting(true);
    const result = await createDeal(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Deal created.");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Plus />
          New deal
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New deal</SheetTitle>
          <SheetDescription>Record a sales agreement with a customer.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 px-1">
          <div className="space-y-1.5">
            <Label>Customer *</Label>
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
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="e.g. Annual Pro plan" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (USD) *</Label>
              <Input id="amount" type="number" min={0} step={0.01} {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="WON">Won</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="animate-spin" />}
            Create deal
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
