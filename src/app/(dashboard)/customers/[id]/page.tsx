import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Tag as TagIcon } from "lucide-react";
import { getCurrentMembership } from "@/lib/current-membership";
import { getCustomer } from "@/features/customers/actions/get-customer";
import { deleteCustomer } from "@/features/customers/actions/customer-actions";
import { CustomerFormSheet } from "@/features/customers/components/customer-form-sheet";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { ActivityTimeline } from "@/features/customers/components/activity-timeline";
import { NotesSection } from "@/features/customers/components/notes-section";
import { DocumentsSection } from "@/features/customers/components/documents-section";
import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";

const LEAD_STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { id } = await params;
  const customer = await getCustomer(membership.organization.id, id);
  if (!customer) notFound();

  const uploadsEnabled = Boolean(process.env.UPLOADTHING_TOKEN);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Link href="/customers" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to customers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
            <CustomerStatusBadge status={customer.status} />
          </div>
          {customer.company && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="size-4" />
              {customer.company}
              {customer.industry && ` · ${customer.industry}`}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {customer.tags.map((t) => (
              <Badge key={t} variant="secondary">
                <TagIcon />
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <CustomerFormSheet
            existing={{
              id: customer.id,
              name: customer.name,
              email: customer.email ?? "",
              phone: customer.phone ?? "",
              company: customer.company ?? "",
              industry: customer.industry ?? "",
              address: customer.address ?? "",
              status: customer.status,
              tags: customer.tags,
              notes: customer.notes ?? "",
            }}
          />
          <DeleteButton
            action={deleteCustomer.bind(null, customer.id)}
            confirmMessage={`Delete "${customer.name}"? This also removes their leads, deals, tasks, meetings, notes and documents.`}
            redirectTo="/customers"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{customer.email || "No email"}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <Phone className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{customer.phone || "No phone"}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{customer.address || "No address"}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notes">Notes ({customer.notesList.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({customer.documents.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-4">
              <ActivityTimeline activities={customer.activities} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <NotesSection customerId={customer.id} notes={customer.notesList} />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <DocumentsSection customerId={customer.id} documents={customer.documents} uploadsEnabled={uploadsEnabled} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads ({customer.leads.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.leads.length === 0 && <p className="text-sm text-muted-foreground">No leads yet.</p>}
              {customer.leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{LEAD_STAGE_LABELS[lead.stage] ?? lead.stage}</Badge>
                  <span className="font-medium">{formatMoney(lead.value / 100)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deals ({customer.deals.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.deals.length === 0 && <p className="text-sm text-muted-foreground">No deals yet.</p>}
              {customer.deals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{deal.title}</span>
                  <span className="font-medium">{formatMoney(deal.amount / 100)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tasks ({customer.tasks.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
              {customer.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{task.title}</span>
                  {task.dueDate && <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meetings ({customer.meetings.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.meetings.length === 0 && <p className="text-sm text-muted-foreground">No meetings yet.</p>}
              {customer.meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{meeting.title}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(meeting.scheduledAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
