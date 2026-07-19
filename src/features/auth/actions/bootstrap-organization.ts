import "server-only";
import { db } from "@/lib/db";
import { ensureUniqueOrgSlug } from "@/lib/slug";

/**
 * Creates a brand-new user's first Organization and makes them its OWNER.
 * Called from the register action (Credentials sign-up) and from the
 * NextAuth `createUser` event (first-time Google sign-in).
 */
export async function bootstrapOrganizationForUser(userId: string, orgNameHint: string) {
  const slug = await ensureUniqueOrgSlug(orgNameHint);

  return db.organization.create({
    data: {
      name: orgNameHint,
      slug,
      memberships: {
        create: { userId, role: "OWNER" },
      },
    },
  });
}
