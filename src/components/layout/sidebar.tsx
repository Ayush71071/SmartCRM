import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NavLinks } from "@/components/layout/nav-links";

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <Sparkles className="size-5 text-brand" />
        <span className="font-semibold">SmartCRM</span>
      </Link>
      <NavLinks isAdmin={isAdmin} />
    </aside>
  );
}
