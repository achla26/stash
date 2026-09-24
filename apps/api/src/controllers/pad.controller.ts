import { Context } from "hono";
import { PadService } from "../services/pad.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { createPadSchema, updatePadSchema } from "@repo/contracts/schemas";
import { AuthService } from "../services/auth.service";

export class PadController {
  private static async getOptionalUser(c: Context): Promise<string | null> {
    try {
      const authHeader = c.req.header("Authorization");
      if (!authHeader?.startsWith("Bearer ")) return null;

      const token = authHeader.split(" ")[1];
      if (!token) return null;

      const { id } = await AuthService.verifyAccessToken(token);
      return id;
    } catch {
      return null;
    }
  }

  static async getBySlug(c: Context) {
    const slug = c.req.param("slug") ?? "";
    const userId = await PadController.getOptionalUser(c);

    const ownerToken = c.req.header("x-pad-owner") ?? null;
    const result = await PadService.accessPad(slug, userId, ownerToken);

    if (result.error && result.statusCode) {
      const code = result.statusCode === 410 ? "PAD_EXPIRED" : "FORBIDDEN";
      return ApiResponse.error(
        c,
        result.statusCode as 410 | 403,
        result.error,
        code
      );
    }

    return ApiResponse.success(c, result);
  }

  static async verifyPassword(c: Context) {
    const slug = c.req.param("slug") ?? "";
    const body = await c.req.json();

    if (!body.password || typeof body.password !== "string") {
      throw ApiError.badRequest("Password is required");
    }

    const result = await PadService.verifyPassword(slug, body.password);
    return ApiResponse.success(c, result);
  }

  static async create(c: Context) {
    const body = await c.req.json();

    const parsed = createPadSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const userId = await PadController.getOptionalUser(c);
    const pad = await PadService.create(parsed.data, userId);
    return ApiResponse.created(c, pad, "Pad created successfully");
  }

  static async update(c: Context) {
    const slug = c.req.param("slug") as string;
    const body = await c.req.json();

    const parsed = updatePadSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const userId = await PadController.getOptionalUser(c);
    const ownerToken = c.req.header("x-pad-owner") ?? null;
    const pad = await PadService.update(slug, parsed.data, userId, ownerToken);
    return ApiResponse.success(c, pad, "Pad updated successfully");
  }

  static async delete(c: Context) {
    const slug = c.req.param("slug") as string;
    const userId = await PadController.getOptionalUser(c);

    if (!userId) {
      throw ApiError.unauthorized("Authentication required to delete pads");
    }

    await PadService.delete(slug, userId);
    return ApiResponse.success(c, null, "Pad deleted successfully");
  }

  static async getUserPads(c: Context) {
    const userId = await PadController.getOptionalUser(c);

    if (!userId) {
      throw ApiError.unauthorized("Authentication required to view your pads");
    }

    const pads = await PadService.getUserPads(userId);
    return ApiResponse.success(c, pads);
  }
}