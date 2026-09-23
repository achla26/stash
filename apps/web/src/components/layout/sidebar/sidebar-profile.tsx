"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoredUser {
  name?: string | null;
  email?: string;
  avatar?: string | null;
}

export function SidebarProfile() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw) as StoredUser);
    } catch {
      // corrupt storage — ignore
    }
  }, []);

  const name = user?.name || user?.email?.split("@")[0] || "You";
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-3 rounded-lg bg-accent p-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt="User avatar" />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
