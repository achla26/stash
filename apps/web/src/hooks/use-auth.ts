"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@repo/contracts/types";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getUser = (): User | null => {
    if (typeof window === "undefined") return null;
    try {
      const user = localStorage.getItem("user");
      return user ? (JSON.parse(user) as User) : null;
    } catch {
      return null;
    }
  };

  return { isLoading, isAuthenticated, logout, getUser };
}