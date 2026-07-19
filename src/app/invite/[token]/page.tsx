import { XCircle, Building2 } from "lucide-react";
import { getInvitationByToken } from "@/features/admin/actions/get-invitation";
import { AcceptInviteButton } from "@/features/admin/components/accept-invite-button";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  const invalid = !invitation || invitation.acceptedAt || invitation.expiresAt < new Date();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      {invalid ? (
        <>
          <XCircle className="size-10 text-destructive" />
          <h1 className="text-xl font-semibold">Invalid invitation</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            This invitation link is invalid, expired, or has already been used.
          </p>
        </>
      ) : (
        <>
          <Building2 className="size-10 text-brand" />
          <h1 className="text-xl font-semibold">Join {invitation.organization.name}</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            You've been invited to join as a {invitation.role.replace("_", " ").toLowerCase()}.
          </p>
          <AcceptInviteButton token={token} />
        </>
      )}
    </div>
  );
}
