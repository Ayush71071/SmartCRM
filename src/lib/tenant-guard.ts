import "server-only";
import { db } from "@/lib/db";

/**
 * Confirms every given user id is actually a member of the organization.
 * Used to validate client-supplied assignee/attendee ids before writing
 * them onto a record — without this, any authenticated user could set
 * assignedToId/attendeeUserIds to an arbitrary user id from anywhere in
 * the database, not just their own org.
 */
export async function verifyMembersInOrg(organizationId: string, userIds: string[]): Promise<boolean> {
  if (userIds.length === 0) return true;
  const uniqueIds = [...new Set(userIds)];
  const count = await db.membership.count({ where: { organizationId, userId: { in: uniqueIds } } });
  return count === uniqueIds.length;
}
