"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-account";

export function DemoLoginButton({ next }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function tryDemo() {
    setLoading(true);
    const result = await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Demo login is unavailable right now — please try again shortly.");
      return;
    }
    router.push(next || "/dashboard");
    router.refresh();
  }

  return (
    <Button type="button" variant="brand" className="w-full" onClick={tryDemo} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Try the demo — no sign-up needed
    </Button>
  );
}
