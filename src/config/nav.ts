import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CheckSquare,
  CalendarDays,
  Receipt,
  Sparkles,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Leads", href: "/leads", icon: KanbanSquare },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Meetings", href: "/meetings", icon: CalendarDays },
  { title: "Sales", href: "/sales", icon: Receipt },
  { title: "AI Tools", href: "/ai", icon: Sparkles },
];

export const ADMIN_NAV_ITEM: NavItem = { title: "Admin", href: "/admin", icon: ShieldCheck };
export const SETTINGS_NAV_ITEM: NavItem = { title: "Settings", href: "/settings", icon: Settings };
