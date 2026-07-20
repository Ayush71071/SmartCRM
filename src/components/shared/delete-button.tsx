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
  size = "sm",
}: {
  action: () => Promise<ActionResult>;
  confirmMessage: string;
  redirectTo?: string;
  label?: string;
  size?: "sm" | "icon";
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
    <Button variant="outline" size={size} className={size === "icon" ? "size-6" : undefined} onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Trash2 className={size === "icon" ? "size-3.5" : undefined} />}
      {label}
    </Button>
  );
}
