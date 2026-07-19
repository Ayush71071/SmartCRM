"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/features/admin/actions/invite-actions";

export function AcceptInviteButton({ token }: { token: string }) {
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  async function handleAccept() {
    setState("loading");
    const result = await acceptInvitation(token);
    if (!result.ok) {
      setError(result.error);
      setState("error");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <>
        <CheckCircle2 className="size-10 text-success" />
        <h1 className="text-xl font-semibold">You're in!</h1>
        <p className="max-w-sm text-sm text-muted-foreground">You've joined the organization.</p>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </>
    );
  }

  if (state === "error") {
    return (
      <>
        <XCircle className="size-10 text-destructive" />
        <h1 className="text-xl font-semibold">Couldn't accept invitation</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </>
    );
  }

  return (
    <Button onClick={handleAccept} disabled={state === "loading"}>
      {state === "loading" && <Loader2 className="animate-spin" />}
      Accept invitation
    </Button>
  );
}
