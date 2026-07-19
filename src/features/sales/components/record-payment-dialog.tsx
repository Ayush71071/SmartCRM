"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { paymentSchema, type PaymentInput } from "@/features/sales/schemas/sales-schemas";
import { recordPayment } from "@/features/sales/actions/invoice-actions";

export function RecordPaymentDialog({ invoiceId, remaining }: { invoiceId: string; remaining: number }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { invoiceId, amount: remaining, method: "CARD", reference: "" },
  });

  async function onSubmit(data: PaymentInput) {
    setSubmitting(true);
    const result = await recordPayment(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment recorded.");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CreditCard />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>Log a payment received against this invoice.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("invoiceId")} />
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (USD) *</Label>
            <Input id="amount" type="number" min={0.01} step={0.01} {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" placeholder="Optional" {...register("reference")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
