"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateOrgPlan } from "@/features/admin/actions/org-actions";

const PLANS = [
  { value: "FREE", label: "Free", description: "Up to 2 seats, core CRM features" },
  { value: "STARTER", label: "Starter", description: "Up to 5 seats, AI tools included" },
  { value: "PRO", label: "Pro", description: "Up to 20 seats, priority support" },
  { value: "ENTERPRISE", label: "Enterprise", description: "Unlimited seats, dedicated support" },
] as const;

export function PlanCard({ currentPlan, canEdit }: { currentPlan: string; canEdit: boolean }) {
  const router = useRouter();
  const [plan, setPlan] = React.useState(currentPlan);
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateOrgPlan(plan as never);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Plan updated.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>Your organization&apos;s subscription tier.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={plan} onValueChange={setPlan} disabled={!canEdit}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLANS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label} — {p.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving || plan === currentPlan} size="sm">
            {saving && <Loader2 className="animate-spin" />}
            Save plan
          </Button>
        )}
        {!canEdit && <p className="text-xs text-muted-foreground">Only the organization owner can change the plan.</p>}
      </CardContent>
    </Card>
  );
}
