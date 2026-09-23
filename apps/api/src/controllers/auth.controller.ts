import { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import {
  loginSchema,
  signupSchema,
  refreshTokenSchema,
} from "@repo/contracts/schemas";

export class AuthController {
  static async signup(c: Context) {
    const body = await c.req.json();

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const result = await AuthService.signup(parsed.data);
    return ApiResponse.created(c, result, "Signup successful");
  }

  static async login(c: Context) {
    const body = await c.req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const result = await AuthService.login(parsed.data);
    return ApiResponse.success(c, result, "Login successful");
  }

  static async logout(c: Context) {
    const token = c.req.header("Authorization")?.split(" ")[1];

    if (!token) {
      throw ApiError.badRequest("No token provided");
    }

    await AuthService.logout(token);
    return ApiResponse.success(c, null, "Logged out successfully");
  }

  static async me(c: Context) {
    const token = c.req.header("Authorization")?.split(" ")[1];

    if (!token) {
      throw ApiError.unauthorized("No token provided");
    }

    const user = await AuthService.getCurrentUser(token);
    return ApiResponse.success(c, user);
  }

  static async refresh(c: Context) {
    const body = await c.req.json();

    const parsed = refreshTokenSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const result = await AuthService.refreshToken(parsed.data.refreshToken);
    return ApiResponse.success(c, result, "Token refreshed");
  }

  static async changePassword(c: Context) {
    const user = c.get("user") as { id: string; email: string };
    const body = await c.req.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest("currentPassword and newPassword are required");
    }
    await AuthService.changePassword(user.id, currentPassword, newPassword);
    return ApiResponse.success(c, null, "Password changed successfully");
  }
}
