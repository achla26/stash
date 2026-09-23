import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { LoginInput, SignupInput } from "@repo/contracts/schemas";
import type { AuthResponse } from "@repo/contracts/types";

export function createAuthService(client: HttpClient) {
  return {
    async login(payload: LoginInput): Promise<AuthResponse> {
      const res = await client.post<ApiSuccessResponse<AuthResponse>>("/api/auth/login", payload);
      return (res as unknown as ApiSuccessResponse<AuthResponse>).data;
    },

    async signup(payload: SignupInput): Promise<AuthResponse> {
      const res = await client.post<ApiSuccessResponse<AuthResponse>>("/api/auth/signup", payload);
      return (res as unknown as ApiSuccessResponse<AuthResponse>).data;
    },

    async logout(): Promise<void> {
      await client.post("/api/auth/logout");
    },

    async refresh(refreshToken: string): Promise<AuthResponse> {
      const res = await client.post<ApiSuccessResponse<AuthResponse>>("/api/auth/refresh", { refreshToken });
      return (res as unknown as ApiSuccessResponse<AuthResponse>).data;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;