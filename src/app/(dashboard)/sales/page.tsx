import { redirect } from "next/navigation";
import { DollarSign, Clock } from "lucide-react";
import { getCurrentMembership } from "@/lib/current-membership";
import { listSalesData } from "@/features/sales/actions/list-sales-data";
import { deleteProduct } from "@/features/sales/actions/product-actions";
import { deleteInvoice } from "@/features/sales/actions/invoice-actions";
import { deleteDeal } from "@/features/sales/actions/deal-actions";
import { ProductFormSheet } from "@/features/sales/components/product-form-sheet";
import { InvoiceFormSheet } from "@/features/sales/components/invoice-form-sheet";
import { DealFormSheet } from "@/features/sales/components/deal-form-sheet";
import { RecordPaymentDialog } from "@/features/sales/components/record-payment-dialog";
import { InvoiceStatusBadge, DealStatusBadge } from "@/features/sales/components/sales-badges";
import { DeleteButton } from "@/components/shared/delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { products, invoices, deals, customers, totalRevenue, outstanding } = await listSalesData(
    membership.organization.id
  );
  const dealOptions = deals.map((d) => ({ id: d.id, title: d.title, customerId: d.customerId }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-sm text-muted-foreground">Products, invoices, payments and deals.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-success/15 text-success">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{formatMoney(totalRevenue / 100)}</p>
              <p className="text-xs text-muted-foreground">Total revenue collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{formatMoney(outstanding / 100)}</p>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <InvoiceFormSheet customers={customers} deals={dealOptions} />
          </div>
          {invoices.length === 0 ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No invoices yet.
            </p>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const paid = invoice.payments
                      .filter((p) => p.status === "SUCCEEDED")
                      .reduce((s, p) => s + p.amount, 0);
                    const remaining = (invoice.total - paid) / 100;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customer.name}</TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>{formatMoney(invoice.total / 100)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {invoice.status !== "PAID" && invoice.status !== "VOID" && (
                              <RecordPaymentDialog invoiceId={invoice.id} remaining={remaining} />
                            )}
                            <DeleteButton
                              action={deleteInvoice.bind(null, invoice.id)}
                              confirmMessage={`Delete invoice ${invoice.invoiceNumber}?`}
                              label=""
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <DealFormSheet customers={customers} />
          </div>
          {deals.length === 0 ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No deals yet.
            </p>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell>{deal.customer.name}</TableCell>
                      <TableCell>
                        <DealStatusBadge status={deal.status} />
                      </TableCell>
                      <TableCell>{formatMoney(deal.amount / 100)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DeleteButton
                            action={deleteDeal.bind(null, deal.id)}
                            confirmMessage={`Delete "${deal.title}"?`}
                            label=""
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <ProductFormSheet />
          </div>
          {products.length === 0 ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No products yet.
            </p>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || "—"}</TableCell>
                      <TableCell>{formatMoney(product.price / 100)}</TableCell>
                      <TableCell>
                        <Badge variant={product.active ? "success" : "secondary"}>
                          {product.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <ProductFormSheet
                            existing={{
                              id: product.id,
                              name: product.name,
                              description: product.description ?? "",
                              price: product.price / 100,
                              sku: product.sku ?? "",
                              active: product.active,
                            }}
                          />
                          <DeleteButton
                            action={deleteProduct.bind(null, product.id)}
                            confirmMessage={`Delete "${product.name}"?`}
                            label=""
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
