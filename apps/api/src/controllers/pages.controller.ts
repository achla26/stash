import { Context } from "hono";
import { PagesService } from "../services/pages.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { updatePageSchema } from "@repo/contracts/schemas";

const pagesService = new PagesService();

export class PagesController {
  static async getPage(c: Context) {
    const userId = c.get("user").id as string;
    const pageId = c.req.param("pageId") as string;
    const page = await pagesService.getById(pageId, userId);
    return ApiResponse.success(c, page);
  }

  static async updatePage(c: Context) {
    const userId = c.get("user").id as string;
    const pageId = c.req.param("pageId") as string;
    const body = await c.req.json();

    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const page = await pagesService.update(pageId, userId, parsed.data);
    return ApiResponse.success(c, page, "Page updated successfully");
  }

  static async deletePage(c: Context) {
    const userId = c.get("user").id as string;
    const pageId = c.req.param("pageId") as string;
    await pagesService.softDelete(pageId, userId);
    return ApiResponse.success(c, null, "Page deleted");
  }
}