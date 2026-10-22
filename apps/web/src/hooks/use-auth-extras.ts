"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { clearAppCaches } from "@/lib/react-query";

type AuthResponse = {
  user?: { id: string; email: string; name?: string | null };
  session?: { accessToken: string; refreshToken: string };
};

function storeSession(raw: unknown) {
  const res = raw as { data?: AuthResponse } & AuthResponse;
  const data = (res?.data ?? res) as AuthResponse;
  if (data?.session?.accessToken && typeof window !== "undefined") {
    localStorage.setItem("access_token", data.session.accessToken);
    localStorage.setItem("refresh_token", data.session.refreshToken ?? "");
  }
  if (data?.user && typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
}

export function useGoogleLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idToken: string) => {
      const res = await apiClient.post("/api/auth/google", { idToken });
      return res as unknown as AuthResponse | { data: AuthResponse };
    },
    onSuccess: (raw) => {
      storeSession(raw);
      clearAppCaches(queryClient);
      router.push("/dashboard");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await apiClient.post("/api/auth/forgot-password", { email });
      return res as unknown as { data?: { sent: boolean; smtpConfigured: boolean } };
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (vars: { token: string; newPassword: string }) => {
      const res = await apiClient.post("/api/auth/reset-password", vars);
      return res as unknown as { data?: unknown };
    },
  });
}
