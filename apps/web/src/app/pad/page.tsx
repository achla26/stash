"use client";

import { PadLanding } from "@/components/pads/pad-landing";
import DashboardLayout from "@/app/(dashboard)/layout";
import { useAuth } from "@/hooks/use-auth";

export default function PadPage() {
  const { isAuthenticated, isLoading } = useAuth({ redirect: false });
  if (isLoading) return null;
  return isAuthenticated ? <DashboardLayout><PadLanding embedded /></DashboardLayout> : <PadLanding />;
}
