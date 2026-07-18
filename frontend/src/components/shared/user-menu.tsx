"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { DEMO_MODE } from "@/utils/demo-mode";
import { ROLE_LABELS } from "@/utils/constants";

function initials(name: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const { data: user } = useUser();

  const handleSignOut = async () => {
    if (!DEMO_MODE) {
      await fetch("/api/session/logout", { method: "POST" });
    }
    // Hard navigation so no stale logged-in pages survive in the router cache
    // (mirrors the login flow, which also avoids soft navigation after a
    // cookie change).
    window.location.assign("/login");
  };

  if (!user) {
    return <Avatar className="h-9 w-9" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 rounded-full px-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.profile.avatar_url ?? undefined} alt={user.profile.full_name ?? "User"} />
            <AvatarFallback>{initials(user.profile.full_name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
            {user.profile.full_name ?? user.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{user.profile.full_name ?? "User"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {ROLE_LABELS[user.profile.role]}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.profile.role === "fresher" && (
          <DropdownMenuItem asChild>
            <Link href="/fresher/settings/profile">
              <Settings className="mr-2 h-4 w-4" /> Profile settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled>
          <UserRound className="mr-2 h-4 w-4" /> {user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
