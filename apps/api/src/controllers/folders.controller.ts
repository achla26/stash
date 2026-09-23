import { Context } from "hono";
import { FoldersService } from "../services/folders.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { createFolderSchema, updateFolderSchema } from "@repo/contracts/schemas";

const foldersService = new FoldersService();

export class FoldersController {
  static async getAll(c: Context) {
    const userId = c.get("user").id as string;
    const folders = await foldersService.getAll(userId);
    return ApiResponse.success(c, folders);
  }

  static async getById(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const folder = await foldersService.getById(id, userId);
    return ApiResponse.success(c, folder);
  }

  static async getByType(c: Context) {
    const userId = c.get("user").id as string;
    const type = c.req.param("type") as string;
    const folders = await foldersService.getByType(type, userId);
    return ApiResponse.success(c, folders);
  }

  static async create(c: Context) {
    const userId = c.get("user").id as string;
    const body = await c.req.json();

    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const folder = await foldersService.create(userId, parsed.data);
    return ApiResponse.created(c, folder, "Folder created successfully");
  }

  static async update(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const body = await c.req.json();

    const parsed = updateFolderSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const folder = await foldersService.update(id, userId, parsed.data);
    return ApiResponse.success(c, folder, "Folder updated successfully");
  }

  static async softDelete(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    await foldersService.softDelete(id, userId);
    return ApiResponse.success(c, null, "Folder moved to trash");
  }

  static async restore(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const folder = await foldersService.restore(id, userId);
    return ApiResponse.success(c, folder, "Folder restored successfully");
  }

  static async permanentDelete(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    await foldersService.permanentDelete(id, userId);
    return ApiResponse.noContent(c);
  }

  static async getTrashed(c: Context) {
    const userId = c.get("user").id as string;
    const folders = await foldersService.getTrashed(userId);
    return ApiResponse.success(c, folders);
  }

  static async togglePin(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const folder = await foldersService.togglePin(id, userId);
    const message = folder.isPinned ? "Folder pinned" : "Folder unpinned";
    return ApiResponse.success(c, folder, message);
  }
}