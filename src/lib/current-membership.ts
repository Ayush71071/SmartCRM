import "server-only";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const ACTIVE_ORG_COOKIE = "smartcrm_active_org";

/**
 * Resolves the signed-in user's active Organization + Role for this request.
 * Every org-scoped query and RBAC check should go through this rather than
 * trusting a client-supplied organizationId.
 */
export async function getCurrentMembership() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const active = memberships.find((m) => m.organizationId === activeOrgId) ?? memberships[0];

  return {
    user: session.user,
    membership: active,
    organization: active.organization,
    role: active.role,
    memberships,
  };
}

export type CurrentMembership = NonNullable<Awaited<ReturnType<typeof getCurrentMembership>>>;
