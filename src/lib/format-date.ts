import { formatDistanceToNow } from "date-fns";

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(d: Date | string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}
