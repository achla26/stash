import { Context } from "hono";
import { BaseService, PaginationParams } from "../services/base.service";
import { ApiResponse } from "../lib/api-response";
import { validateRequest } from "../middleware/validate-request";
import { ZodSchema } from "@repo/contracts/schemas"; 
export class BaseController<
  T,
  R = T,
  CreateDTO = Partial<T>,
  UpdateDTO = Partial<T>
> {
  protected service: BaseService<T, R>;
  protected createSchema?: ZodSchema<CreateDTO>;
  protected updateSchema?: ZodSchema<UpdateDTO>;

  constructor(
    service: BaseService<T, R>,
    createSchema?: ZodSchema<CreateDTO>,
    updateSchema?: ZodSchema<UpdateDTO>
  ) {
    this.service = service;
    this.createSchema = createSchema;
    this.updateSchema = updateSchema;
  }

  async getAll(c: Context) {
    const userId = await this.getUserId(c);
    const filters = await this.getFilters(c);
    const data = await this.service.getAll(userId, filters);
    return ApiResponse.success(c, data);
  }

  async getById(c: Context) {
    const id = c.req.param("id") as string;
    const userId = await this.getUserId(c);
    const data = await this.service.getById(id, userId);
    return ApiResponse.success(c, data);
  }

  async create(c: Context) {
    if (!this.createSchema) {
      throw new Error("Create schema not provided");
    }

    const body = await validateRequest(c, this.createSchema);
    const userId = await this.getUserId(c);
    const data = await this.service.create(
      userId,
      body as Record<string, unknown>
    );
    return ApiResponse.created(
      c,
      data,
      `${this.getResourceName()} created successfully`
    );
  }

  async update(c: Context) {
    const id = c.req.param("id") as string;

    let body: UpdateDTO;
    if (this.updateSchema) {
      body = await validateRequest(c, this.updateSchema);
    } else {
      body = await c.req.json();
    }

    const userId = await this.getUserId(c);
    const data = await this.service.update(
      id,
      userId,
      body as Record<string, unknown>
    );
    return ApiResponse.success(
      c,
      data,
      `${this.getResourceName()} updated successfully`
    );
  }

  async softDelete(c: Context) {
    const id = c.req.param("id") as string;
    const userId = await this.getUserId(c);
    await this.service.softDelete(id, userId);
    return ApiResponse.success(
      c,
      null,
      `${this.getResourceName()} moved to trash`
    );
  }

  async restore(c: Context) {
    const id = c.req.param("id") as string;
    const userId = await this.getUserId(c);
    const data = await this.service.restore(id, userId);
    return ApiResponse.success(
      c,
      data,
      `${this.getResourceName()} restored successfully`
    );
  }

  async permanentDelete(c: Context) {
    const id = c.req.param("id") as string;
    const userId = await this.getUserId(c);
    await this.service.permanentDelete(id, userId);
    return ApiResponse.success(
      c,
      null,
      `${this.getResourceName()} permanently deleted`
    );
  }

  async getTrashed(c: Context) {
    const userId = await this.getUserId(c);
    const data = await this.service.getTrashed(userId);
    return ApiResponse.success(c, data);
  }

  async getPaginated(c: Context) {
    const userId = await this.getUserId(c);
    const params = await this.getPaginationParams(c);
    const result = await this.service.getPaginated(userId, params);
    return ApiResponse.success(c, result);
  }

  async bulkSoftDelete(c: Context) {
    const { ids } = await c.req.json<{ ids: string[] }>();
    const userId = await this.getUserId(c);
    await this.service.bulkSoftDelete(ids, userId);
    return ApiResponse.success(
      c,
      null,
      `${ids.length} items moved to trash`
    );
  }

  async bulkPermanentDelete(c: Context) {
    const { ids } = await c.req.json<{ ids: string[] }>();
    const userId = await this.getUserId(c);
    await this.service.bulkPermanentDelete(ids, userId);
    return ApiResponse.success(
      c,
      null,
      `${ids.length} items permanently deleted`
    );
  }

  async getCount(c: Context) {
    const userId = await this.getUserId(c);
    const filters = await this.getFilters(c);
    const count = await this.service.count(userId, filters);
    return ApiResponse.success(c, { count });
  }

  protected async getUserId(c: Context): Promise<string> {
    const user = c.get("user");
    if (!user?.id) {
      throw new Error("User not authenticated");
    }
    return user.id as string;
  }

  protected async getFilters(
    c: Context
  ): Promise<Record<string, unknown>> {
    const query = c.req.query();
    const filters: Record<string, unknown> = {};

    if (query.folderId) filters.folder_id = query.folderId;
    if (query.status) filters.status = query.status;

    return filters;
  }

  protected async getPaginationParams(
    c: Context
  ): Promise<PaginationParams> {
    const query = c.req.query();

    return {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      sortBy: query.sortBy ?? "created_at",
      sortOrder: (query.sortOrder as "asc" | "desc") ?? "desc",
      searchField: query.searchField,
      searchQuery: query.searchQuery,
    };
  }

  protected getResourceName(): string {
    const service = this.service as unknown as { tableName: string };
    return service.tableName.slice(0, -1);
  }
}