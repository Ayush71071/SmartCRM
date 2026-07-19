import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentMembership } from "@/lib/current-membership";
import { listCustomers } from "@/features/customers/actions/list-customers";
import { CustomerFormSheet } from "@/features/customers/components/customer-form-sheet";
import { CustomerFilters } from "@/features/customers/components/customer-filters";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { q, status, page } = await searchParams;
  const { items, total, totalPages, page: currentPage } = await listCustomers(membership.organization.id, {
    q,
    status,
    page: page ? parseInt(page, 10) : 1,
  });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/customers?${params.toString()}`;
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <CustomerFormSheet />
      </div>

      <CustomerFilters q={q} status={status} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-14 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="font-medium">No customers found</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {q || status ? "Try a different search or filter." : "Add your first customer to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Leads / Deals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </TableCell>
                  <TableCell>{c.company || "—"}</TableCell>
                  <TableCell>
                    <CustomerStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                      {c.tags.length > 2 && <Badge variant="secondary">+{c.tags.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{c.owner?.name || "—"}</TableCell>
                  <TableCell>
                    {c._count.leads} / {c._count.deals}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} makeHref={makeHref} />
    </div>
  );
}
