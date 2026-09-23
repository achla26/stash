"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";
import type { LoginInput } from "@repo/contracts/schemas";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: LoginInput) => authService.login(values),

    onSuccess: (data) => {
      // data is AuthResponse — all camelCase
      if (data?.session?.accessToken) {
        localStorage.setItem("access_token", data.session.accessToken);
        localStorage.setItem("refresh_token", data.session.refreshToken);
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    },

    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
}