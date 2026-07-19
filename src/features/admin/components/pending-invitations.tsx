"use client";

import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/shared/delete-button";
import { revokeInvitation } from "@/features/admin/actions/invite-actions";
import { formatDate } from "@/lib/format-date";

type Invitation = { id: string; email: string; role: string; expiresAt: Date };

export function PendingInvitations({ invitations }: { invitations: Invitation[] }) {
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Pending invitations</h3>
      <ul className="space-y-2">
        {invitations.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{inv.email}</p>
                <p className="text-xs text-muted-foreground">Expires {formatDate(inv.expiresAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{inv.role.replace("_", " ")}</Badge>
              <DeleteButton
                action={revokeInvitation.bind(null, inv.id)}
                confirmMessage={`Revoke the invitation to ${inv.email}?`}
                label="Revoke"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
