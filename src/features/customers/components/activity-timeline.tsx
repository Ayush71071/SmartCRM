import {
  StickyNote,
  Mail,
  Phone,
  CalendarDays,
  ArrowRightLeft,
  RefreshCcw,
  CheckSquare,
  FileText,
  Sparkles,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/format-date";

const ICONS: Record<string, LucideIcon> = {
  NOTE: StickyNote,
  EMAIL: Mail,
  CALL: Phone,
  MEETING: CalendarDays,
  STAGE_CHANGE: ArrowRightLeft,
  STATUS_CHANGE: RefreshCcw,
  TASK: CheckSquare,
  DOCUMENT: FileText,
  AI_ACTION: Sparkles,
  SYSTEM: Settings2,
};

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
  actor: { name: string } | null;
};

export function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {activities.map((activity) => {
        const Icon = ICONS[activity.type] ?? Settings2;
        return (
          <li key={activity.id} className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
