import { Context } from "hono";
import { NotebooksService } from "@/services/notebook.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import {
  createNotebookSchema,
  updateNotebookSchema,
} from "@repo/contracts/schemas";

const notebooksService = new NotebooksService();

export class NotebooksController {
  // ===== NOTEBOOKS =====

  static async getAll(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const notebooks = await notebooksService.getAllWithCounts(userId);
    return ApiResponse.success(c, notebooks);
  }

  static async getById(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const id = c.req.param("id") as string;
    const notebook = await notebooksService.getWithChildren(id, userId);
    return ApiResponse.success(c, notebook);
  }

  static async create(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const body = await c.req.json();
    const parsed = createNotebookSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const notebook = await notebooksService.create(userId, parsed.data);
    return ApiResponse.created(c, notebook);
  }

  static async update(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const parsed = updateNotebookSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const notebook = await notebooksService.update(id, userId, parsed.data);
    return ApiResponse.success(c, notebook);
  }

  static async softDelete(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const id = c.req.param("id") as string;
    await notebooksService.softDelete(id, userId);
    return ApiResponse.success(c, { deleted: true });
  }

  static async restore(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const id = c.req.param("id") as string;
    const notebook = await notebooksService.restore(id, userId);
    return ApiResponse.success(c, notebook);
  }

  static async togglePin(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const id = c.req.param("id") as string;
    const notebook = await notebooksService.togglePin(id, userId);
    return ApiResponse.success(c, notebook);
  }

  static async getTrashed(c: Context) {
    const userId = (c.get("user") as { id: string }).id;
    const notebooks = await notebooksService.getTrashed(userId);
    return ApiResponse.success(c, notebooks);
  }
}
