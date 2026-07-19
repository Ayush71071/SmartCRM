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
import { TagInput } from "@/components/shared/tag-input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { customerSchema, customerStatusValues, type CustomerInput } from "@/features/customers/schemas/customer-schemas";
import { createCustomer, updateCustomer } from "@/features/customers/actions/customer-actions";

const STATUS_LABELS: Record<(typeof customerStatusValues)[number], string> = {
  LEAD: "Lead",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  CHURNED: "Churned",
};

type ExistingCustomer = CustomerInput & { id: string };

export function CustomerFormSheet({ existing }: { existing?: ExistingCustomer }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: existing ?? {
      name: "",
      email: "",
      phone: "",
      company: "",
      industry: "",
      address: "",
      status: "LEAD",
      tags: [],
      notes: "",
    },
  });

  async function onSubmit(data: CustomerInput) {
    setSubmitting(true);
    const result = existing ? await updateCustomer(existing.id, data) : await createCustomer(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(existing ? "Customer updated." : "Customer created.");
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
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button>
            <Plus />
            New customer
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{existing ? "Edit customer" : "New customer"}</SheetTitle>
          <SheetDescription>
            {existing ? "Update this customer's details." : "Add a new customer to your workspace."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 px-1">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...register("company")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" {...register("industry")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
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
                    {customerStatusValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="animate-spin" />}
            {existing ? "Save changes" : "Create customer"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
