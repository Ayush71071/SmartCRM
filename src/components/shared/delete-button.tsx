"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string };

export function DeleteButton({
  action,
  confirmMessage,
  redirectTo,
  label = "Delete",
}: {
  action: () => Promise<ActionResult>;
  confirmMessage: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    const result = await action();
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Deleted.");
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Trash2 />}
      {label}
    </Button>
  );
}
