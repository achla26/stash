"use client";

import { useAuth } from "@/hooks/use-auth";
import { AppShellSkeleton } from "@/components/shared/skeletons/page-skeleton";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();

  // Jab tak check ho raha hai
  if (isLoading) {
    return <AppShellSkeleton />;
  }

  // Agar authenticated nahi hai
  if (!isAuthenticated) {
    return null; // useAuth already redirect karega
  }

  // Authenticated hai toh children dikhao
  return <>{children}</>;
}