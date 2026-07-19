import { db } from "@/lib/db";

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : "team";
}

/** Appends a numeric suffix until the slug is unique among Organizations. */
export async function ensureUniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 1;
  // Small orgs table; a loop is simpler and clearer than a clever query here.
  while (await db.organization.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
  return candidate;
}
