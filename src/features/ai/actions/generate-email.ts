"use server";

import { db } from "@/lib/db";
import { getCurrentMembership } from "@/lib/current-membership";
import { generateStructured } from "@/lib/openai";
import { logAIUsage } from "@/lib/ai-log";
import { sendEmail } from "@/lib/resend";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export type EmailType = "COLD" | "FOLLOW_UP" | "THANK_YOU" | "PROPOSAL";

type EmailResult = { subject: string; body: string };

const TYPE_LABEL: Record<EmailType, string> = {
  COLD: "cold outreach",
  FOLLOW_UP: "follow-up",
  THANK_YOU: "thank-you",
  PROPOSAL: "proposal",
};

export async function generateEmailAction(input: {
  customerId: string;
  emailType: EmailType;
  context?: string;
}): Promise<ActionResult<EmailResult>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, organizationId: membership.organization.id },
  });
  if (!customer) return { ok: false, error: "Customer not found." };

  const { result, model, tokensUsed } = await generateStructured<EmailResult>({
    system:
      "You are a sales rep at a B2B software company writing a short, friendly, professional email. Respond as JSON: {\"subject\": string, \"body\": string}. Keep the body under 150 words and sign off as \"" +
      membership.user.name +
      "\".",
    user: JSON.stringify({
      emailType: TYPE_LABEL[input.emailType],
      contactName: customer.name,
      company: customer.company,
      industry: customer.industry,
      extraContext: input.context,
    }),
    mock: () => {
      const firstName = customer.name.split(" ")[0];
      const sig = `\n\nBest,\n${membership.user.name}`;
      const templates: Record<EmailType, EmailResult> = {
        COLD: {
          subject: `Quick idea for ${customer.company ?? "your team"}`,
          body: `Hi ${firstName},\n\nI've been looking at ${customer.company ?? "your company"}'s work in ${customer.industry ?? "your space"} and think there's a strong fit with what we offer. Would you be open to a quick 15-minute call this week to explore whether it's useful?${sig}`,
        },
        FOLLOW_UP: {
          subject: `Following up`,
          body: `Hi ${firstName},\n\nJust wanted to follow up on our last conversation — wanted to check if you had any questions, or if there's anything I can help clarify as you evaluate next steps.${sig}`,
        },
        THANK_YOU: {
          subject: `Thank you!`,
          body: `Hi ${firstName},\n\nThank you for taking the time to speak with me — I really enjoyed learning more about ${customer.company ?? "your work"}. Looking forward to continuing the conversation.${sig}`,
        },
        PROPOSAL: {
          subject: `Proposal for ${customer.company ?? firstName}`,
          body: `Hi ${firstName},\n\nAttached is a proposal outlining how we'd work together, based on what you shared about your goals. Let me know if you'd like to walk through it together or if anything needs adjusting.${sig}`,
        },
      };
      const base = templates[input.emailType];
      if (input.context) {
        base.body = `${base.body}\n\nP.S. ${input.context}`;
      }
      return base;
    },
  });

  await logAIUsage({
    organizationId: membership.organization.id,
    userId: membership.user.id,
    type: "EMAIL_GENERATION",
    model,
    input,
    output: result,
    tokensUsed,
    relatedCustomerId: customer.id,
  });

  return { ok: true, data: result };
}

export async function sendGeneratedEmailAction(input: {
  customerId: string;
  subject: string;
  body: string;
}): Promise<ActionResult<{ mocked: boolean }>> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "Not signed in." };

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, organizationId: membership.organization.id },
  });
  if (!customer?.email) return { ok: false, error: "This customer has no email address on file." };

  const result = await sendEmail({
    to: customer.email,
    subject: input.subject,
    html: input.body.replace(/\n/g, "<br/>"),
  });

  return { ok: true, data: { mocked: result.mocked } };
}
