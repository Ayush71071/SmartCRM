"use client";

import * as React from "react";
import { Loader2, Mail, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { generateEmailAction, sendGeneratedEmailAction, type EmailType } from "@/features/ai/actions/generate-email";

type CustomerOption = { id: string; name: string; company: string | null };

const EMAIL_TYPES: { value: EmailType; label: string }[] = [
  { value: "COLD", label: "Cold email" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "THANK_YOU", label: "Thank-you" },
  { value: "PROPOSAL", label: "Proposal" },
];

export function EmailGeneratorPanel({ customers }: { customers: CustomerOption[] }) {
  const [customerId, setCustomerId] = React.useState(customers[0]?.id ?? "");
  const [emailType, setEmailType] = React.useState<EmailType>("COLD");
  const [context, setContext] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [draft, setDraft] = React.useState<{ subject: string; body: string } | null>(null);

  async function handleGenerate() {
    if (!customerId) return;
    setGenerating(true);
    const res = await generateEmailAction({ customerId, emailType, context: context || undefined });
    setGenerating(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDraft(res.data);
  }

  async function handleSend() {
    if (!draft) return;
    setSending(true);
    const res = await sendGeneratedEmailAction({ customerId, subject: draft.subject, body: draft.body });
    setSending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(res.data.mocked ? "Email logged (no RESEND_API_KEY set — check server console)." : "Email sent.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4" />
          AI Email Generator
        </CardTitle>
        <CardDescription>Draft cold, follow-up, thank-you or proposal emails — fully editable before sending.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a customer first.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` · ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={emailType} onValueChange={(v) => setEmailType(v as EmailType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Extra context (optional) — e.g. mention our new pricing tier"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />

            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Generate draft
            </Button>

            {draft && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="space-y-1">
                  <Label htmlFor="ai-email-subject" className="text-xs">
                    Subject
                  </Label>
                  <Input
                    id="ai-email-subject"
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ai-email-body" className="text-xs">
                    Body
                  </Label>
                  <Textarea
                    id="ai-email-body"
                    rows={7}
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                </div>
                <Button size="sm" onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="animate-spin" /> : <Send />}
                  Send email
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
