"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import { NAV_ITEMS } from "@/components/layout/role-nav-config";
import { cn } from "@/utils/cn";
import type { UserRole } from "@/types/user";

function isActiveHref(pathname: string, items: { href: string }[], href: string): boolean {
  const isExact = pathname === href;
  const isPrefix = pathname.startsWith(`${href}/`);
  if (!isExact && !isPrefix) return false;
  const moreSpecificMatch = items.some(
    (other) =>
      other.href !== href &&
      other.href.length > href.length &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`)),
  );
  return !moreSpecificMatch;
}

export function SidebarContent({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href={`/${role}`} className="flex items-center gap-2 px-2 pt-1" onClick={onNavigate}>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="font-semibold tracking-tight">SkillProof AI</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isActiveHref(pathname, items, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
        Transform Learning into Project Readiness.
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  return (
    <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 rounded-none border-l-0 border-t-0 border-b-0 lg:block">
      <SidebarContent role={role} />
    </aside>
  );
}
