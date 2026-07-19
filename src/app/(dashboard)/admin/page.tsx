import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/current-membership";
import { listMembers } from "@/features/admin/actions/list-members";
import { MembersTable } from "@/features/admin/components/members-table";
import { InviteMemberDialog } from "@/features/admin/components/invite-member-dialog";
import { PendingInvitations } from "@/features/admin/components/pending-invitations";
import { PlanCard } from "@/features/admin/components/plan-card";
import { LeaderboardTable } from "@/features/admin/components/leaderboard-table";
import { PermissionsReference } from "@/features/admin/components/permissions-reference";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (membership.role !== "OWNER" && membership.role !== "MANAGER") redirect("/dashboard");

  const { memberships, leaderboard, invitations } = await listMembers(membership.organization.id);
  const isOwner = membership.role === "OWNER";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Manage your team, roles, plan and view analytics.</p>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <InviteMemberDialog canInviteOwner={isOwner} />
          </div>
          <MembersTable members={memberships} currentUserId={membership.user.id} isOwner={isOwner} />
          <PendingInvitations invitations={invitations} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsReference />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanCard currentPlan={membership.organization.plan} canEdit={isOwner} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Salesperson leaderboard</h2>
          <LeaderboardTable members={memberships} leaderboard={leaderboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
