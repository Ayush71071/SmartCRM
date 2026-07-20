import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const ACTIVE_ORG_COOKIE = "smartcrm_active_org";

/**
 * Resolves the signed-in user's active Organization + Role for this request.
 * Every org-scoped query and RBAC check should go through this rather than
 * trusting a client-supplied organizationId.
 *
 * Wrapped in React's `cache()` for request-level memoization — both the
 * dashboard layout and every page it wraps call this, and without memoizing
 * it each navigation would hit the database twice for the same data.
 */
export const getCurrentMembership = cache(async () => {
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
});

export type CurrentMembership = NonNullable<Awaited<ReturnType<typeof getCurrentMembership>>>;
