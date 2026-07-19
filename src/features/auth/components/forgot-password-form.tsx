"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas/auth-schemas";
import { forgotPasswordAction } from "@/features/auth/actions/forgot-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    setSubmitting(true);
    await forgotPasswordAction(data);
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center lg:text-left">
        <MailCheck className="mx-auto size-8 text-brand lg:mx-0" />
        <h2 className="text-2xl font-semibold tracking-tight">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <a href="/login" className="inline-block text-sm font-medium text-foreground hover:underline">
          Back to log in
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">Forgot your password?</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="font-medium text-foreground hover:underline">
          Back to log in
        </a>
      </p>
    </div>
  );
}
