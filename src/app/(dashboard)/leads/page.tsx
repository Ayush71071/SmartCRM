import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/current-membership";
import { getBoardData } from "@/features/leads/actions/get-board-data";
import { KanbanBoardClientOnly } from "@/features/leads/components/kanban-board-loader";
import { LeadFormSheet } from "@/features/leads/components/lead-form-sheet";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { columns, customers, members } = await getBoardData(membership.organization.id);

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Drag cards between stages to update your pipeline.</p>
        </div>
        <LeadFormSheet customers={customers} members={members} />
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-14 text-center">
          <p className="font-medium">Add a customer first</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Leads are tied to a contact — create a customer before adding your first lead.
          </p>
        </div>
      ) : (
        <KanbanBoardClientOnly initialColumns={columns} customers={customers} members={members} />
      )}
    </div>
  );
}
