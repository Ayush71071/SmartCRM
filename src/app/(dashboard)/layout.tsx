import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/current-membership";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const membership = await getCurrentMembership();

  // Middleware already blocks unauthenticated requests; this only covers
  // the edge case of a signed-in user with zero memberships.
  if (!membership) redirect("/login");

  const isAdmin = membership.role === "OWNER" || membership.role === "MANAGER";

  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          isAdmin={isAdmin}
          orgName={membership.organization.name}
          userName={membership.user.name ?? membership.user.email ?? "Account"}
          userEmail={membership.user.email ?? ""}
          userImage={membership.user.image}
        />
        <main className="flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</main>
      </div>
    </div>
  );
}
