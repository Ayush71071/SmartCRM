"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, ADMIN_NAV_ITEM, SETTINGS_NAV_ITEM, type NavItem } from "@/config/nav";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="size-4" />
      {item.title}
    </Link>
  );
}

export function NavLinks({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <NavLink item={SETTINGS_NAV_ITEM} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
