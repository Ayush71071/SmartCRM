"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/shared/delete-button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { updateMemberRole, removeMember } from "@/features/admin/actions/member-actions";
import { formatDate } from "@/lib/format-date";
import type { Role } from "@/lib/rbac";
import type { MemberItem } from "@/features/admin/actions/list-members";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function MembersTable({
  members,
  currentUserId,
  isOwner,
}: {
  members: MemberItem[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();

  async function handleRoleChange(membershipId: string, role: Role) {
    const result = await updateMemberRole(membershipId, role);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    {m.user.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
                    <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {m.user.name}
                      {m.userId === currentUserId && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {isOwner ? (
                  <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v as Role)}>
                    <SelectTrigger size="sm" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="SALES_REP">Sales Representative</SelectItem>
                      <SelectItem value="SUPPORT">Support</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{m.role.replace("_", " ")}</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(m.createdAt)}</TableCell>
              <TableCell>
                {isOwner && m.userId !== currentUserId && (
                  <div className="flex justify-end">
                    <DeleteButton
                      action={removeMember.bind(null, m.id)}
                      confirmMessage={`Remove ${m.user.name} from the organization?`}
                      label="Remove"
                    />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
