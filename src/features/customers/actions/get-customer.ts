import "server-only";
import { db } from "@/lib/db";

export async function getCustomer(organizationId: string, id: string) {
  return db.customer.findFirst({
    where: { id, organizationId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      leads: { orderBy: { createdAt: "desc" } },
      deals: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
      meetings: { orderBy: { scheduledAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      notesList: {
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { createdBy: { select: { name: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { actor: { select: { name: true } } },
      },
    },
  });
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
