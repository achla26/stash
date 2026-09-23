import { Context } from "hono";
import { LinksService } from "../services/links.service";
import { ApiResponse } from "../lib/api-response";
import { BaseController } from "./base.controller";
import { createLinkSchema, updateLinkSchema } from "@repo/contracts/schemas";
import type { Link } from "@repo/contracts/types";
import type { LinkRow } from "../types/link.types";

export class LinksController extends BaseController<Link, LinkRow> {
  private linksService: LinksService;

  constructor() {
    const service = new LinksService();
    super(service, createLinkSchema, updateLinkSchema);
    this.linksService = service;
  }

  protected async getFilters(c: Context): Promise<Record<string, unknown>> {
    const filters = await super.getFilters(c);
    const query = c.req.query();

    if (query.folderId === "null") {
      filters.folder_id = null;
    } else if (query.folderId) {
      filters.folder_id = query.folderId;
    }

    if (query.tag) {
      filters.tags = query.tag;
    }

    return filters;
  }

  async togglePin(c: Context) {
    const id = c.req.param("id") as string;
    const userId = await this.getUserId(c);
    const link = await this.linksService.togglePin(id, userId);
    const message = link.isPinned ? "Link pinned" : "Link unpinned";
    return ApiResponse.success(c, link, message);
  }

  async moveLink(c: Context) {
    const id = c.req.param("id") as string;
    const { folderId } = await c.req.json<{ folderId: string | null }>();
    const userId = await this.getUserId(c);
    const link = await this.linksService.moveLink(id, userId, folderId);
    return ApiResponse.success(c, link, "Link moved successfully");
  }

  async getTrashed(c: Context) {
    const userId = await this.getUserId(c);
    const links = await this.linksService.getTrashed(userId);
    return ApiResponse.success(c, links);
  }

  async getPaginated(c: Context) {
    const userId = await this.getUserId(c);
    const params = await this.getPaginationParams(c);
    const result = await this.linksService.getPaginated(userId, params);
    return ApiResponse.success(c, result);
  }

  async search(c: Context) {
    const userId = await this.getUserId(c);
    const query = c.req.query("q");
    if (!query) return ApiResponse.success(c, []);
    const results = await this.linksService.search(userId, query);
    return ApiResponse.success(c, results);
  }
}