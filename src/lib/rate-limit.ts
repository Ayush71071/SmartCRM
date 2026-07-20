import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// In-memory fixed-window limiter. Good enough for a single Node.js instance
// (this app's current deployment model); a multi-instance production
// deployment would need a shared store (e.g. Upstash Redis) instead, since
// each instance would otherwise track its own counts independently.
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded over long uptimes.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/** Returns true if the action is allowed, false if the caller is rate-limited. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client IP from standard proxy headers (falls back to a fixed key in local dev). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
