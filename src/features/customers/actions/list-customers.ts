import "server-only";
import { db } from "@/lib/db";
import type { CustomerStatus, Prisma } from "@prisma/client";
import { customerStatusValues } from "@/features/customers/schemas/customer-schemas";

const PAGE_SIZE = 10;

function parseStatus(value?: string): CustomerStatus | undefined {
  return value && (customerStatusValues as readonly string[]).includes(value) ? (value as CustomerStatus) : undefined;
}

export async function listCustomers(
  organizationId: string,
  opts: { q?: string; status?: string; page?: number }
) {
  const page = Math.max(1, opts.page ?? 1);
  const status = parseStatus(opts.status);
  const q = opts.q?.trim();

  const where: Prisma.CustomerWhereInput = {
    organizationId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        _count: { select: { leads: true, deals: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.customer.count({ where }),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export type CustomerListItem = Awaited<ReturnType<typeof listCustomers>>["items"][number];
