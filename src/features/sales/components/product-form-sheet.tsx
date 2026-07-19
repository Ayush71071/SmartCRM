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
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { productSchema, type ProductInput } from "@/features/sales/schemas/sales-schemas";
import { createProduct, updateProduct } from "@/features/sales/actions/product-actions";

type ExistingProduct = ProductInput & { id: string };

export function ProductFormSheet({ existing }: { existing?: ExistingProduct }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: existing ?? { name: "", description: "", price: 0, sku: "", active: true },
  });

  async function onSubmit(data: ProductInput) {
    setSubmitting(true);
    const result = existing ? await updateProduct(existing.id, data) : await createProduct(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(existing ? "Product updated." : "Product created.");
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
            New product
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{existing ? "Edit product" : "New product"}</SheetTitle>
          <SheetDescription>Products can be added to deals and invoices.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 px-1">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (USD) *</Label>
              <Input id="price" type="number" min={0} step={1} {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="active">Active</Label>
            <Controller
              control={control}
              name="active"
              render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="animate-spin" />}
            {existing ? "Save changes" : "Create product"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
