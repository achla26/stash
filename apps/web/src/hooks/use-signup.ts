"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";
import { clearAppCaches } from "@/lib/react-query";
import type { SignupInput } from "@repo/contracts/schemas";

export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SignupInput) => authService.signup(values),

    onSuccess: (data) => {
      // data is AuthResponse — all camelCase
      if (data?.session?.accessToken) {
        localStorage.setItem("access_token", data.session.accessToken);
        localStorage.setItem("refresh_token", data.session.refreshToken);
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      clearAppCaches(queryClient);
      router.push("/dashboard");
    },

    onError: (error) => {
      console.error("Signup failed:", error);
    },
  });
}