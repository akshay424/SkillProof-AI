"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NAV_ITEMS } from "@/components/layout/role-nav-config";
import { SidebarContent } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { UserRole } from "@/types/user";

function useSectionTitle(role: UserRole): string {
  const pathname = usePathname();
  const matches = NAV_ITEMS[role]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.label ?? "Dashboard";
}

export function Topbar({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const title = useSectionTitle(role);

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-4 rounded-none border-l-0 border-r-0 border-t-0 px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent role={role} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
