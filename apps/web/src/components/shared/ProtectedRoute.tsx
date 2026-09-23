"use client";

import { useAuth } from "@/hooks/use-auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();

  // Jab tak check ho raha hai
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Agar authenticated nahi hai
  if (!isAuthenticated) {
    return null; // useAuth already redirect karega
  }

  // Authenticated hai toh children dikhao
  return <>{children}</>;
}