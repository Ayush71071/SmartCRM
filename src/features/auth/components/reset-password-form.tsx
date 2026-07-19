"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/schemas/auth-schemas";
import { resetPasswordAction } from "@/features/auth/actions/reset-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setSubmitting(true);
    const result = await resetPasswordAction(data);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  if (!token) {
    return (
      <div className="space-y-3 text-center lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">Invalid link</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is missing its token. Request a new one below.
        </p>
        <a href="/forgot-password" className="inline-block text-sm font-medium text-foreground hover:underline">
          Request a new link
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-3 text-center lg:text-left">
        <CheckCircle2 className="mx-auto size-8 text-success lg:mx-0" />
        <h2 className="text-2xl font-semibold tracking-tight">Password updated</h2>
        <p className="text-sm text-muted-foreground">Redirecting you to log in…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">Set a new password</h2>
        <p className="text-sm text-muted-foreground">Make it at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Reset password
        </Button>
      </form>
    </div>
  );
}
