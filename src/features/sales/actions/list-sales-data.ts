import "server-only";
import { db } from "@/lib/db";

export async function listSalesData(organizationId: string) {
  const [products, invoices, deals, customers] = await Promise.all([
    db.product.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({
      where: { organizationId },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.deal.findMany({
      where: { organizationId },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.customer.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalRevenue = invoices
    .flatMap((i) => i.payments)
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0);

  const outstanding = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.total - i.payments.filter((p) => p.status === "SUCCEEDED").reduce((s, p) => s + p.amount, 0), 0);

  return { products, invoices, deals, customers, totalRevenue, outstanding };
}

export type SalesInvoice = Awaited<ReturnType<typeof listSalesData>>["invoices"][number];
export type SalesDeal = Awaited<ReturnType<typeof listSalesData>>["deals"][number];
