"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";
import type { SignupInput } from "@repo/contracts/schemas";

export function useSignup() {
  const router = useRouter();

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

      router.push("/dashboard");
    },

    onError: (error) => {
      console.error("Signup failed:", error);
    },
  });
}