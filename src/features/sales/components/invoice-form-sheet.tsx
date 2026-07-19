"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { invoiceSchema, type InvoiceInput } from "@/features/sales/schemas/sales-schemas";
import { createInvoice } from "@/features/sales/actions/invoice-actions";
import { formatMoney } from "@/lib/format";

type CustomerOption = { id: string; name: string };
type DealOption = { id: string; title: string; customerId: string };

export function InvoiceFormSheet({ customers, deals }: { customers: CustomerOption[]; deals: DealOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      dealId: "",
      dueDate: "",
      taxRate: 0,
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedTaxRate = watch("taxRate");
  const watchedCustomerId = watch("customerId");

  const subtotal = watchedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const tax = subtotal * ((Number(watchedTaxRate) || 0) / 100);
  const total = subtotal + tax;

  const availableDeals = deals.filter((d) => !watchedCustomerId || d.customerId === watchedCustomerId);

  async function onSubmit(data: InvoiceInput) {
    setSubmitting(true);
    const result = await createInvoice(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Invoice created.");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus />
          New invoice
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New invoice</SheetTitle>
          <SheetDescription>Bill a customer for products or services.</SheetDescription>
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

          {availableDeals.length > 0 && (
            <div className="space-y-1.5">
              <Label>Related deal</Label>
              <Controller
                control={control}
                name="dealId"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableDeals.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date *</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Line items *</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Input placeholder="Description" className="flex-1" {...register(`items.${index}.description`)} />
                <Input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  className="w-16"
                  {...register(`items.${index}.quantity`)}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Unit price"
                  className="w-24"
                  {...register(`items.${index}.unitPrice`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus />
              Add line item
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tax rate (%)</Label>
              <Input id="taxRate" type="number" min={0} max={100} step={0.1} {...register("taxRate")} />
            </div>
          </div>

          <div className="space-y-1.5 rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="animate-spin" />}
            Create invoice
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
