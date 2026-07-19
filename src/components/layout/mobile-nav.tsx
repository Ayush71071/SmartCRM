"use client";

import * as React from "react";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "@/components/layout/nav-links";

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle asChild>
          <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
            <Sparkles className="size-5 text-brand" />
            <span className="font-semibold">SmartCRM</span>
          </div>
        </SheetTitle>
        <NavLinks isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
