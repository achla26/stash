import { eq, and, asc } from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { ApiError } from "../lib/api-error";
import { BaseService } from "./base.service";
import type { CreatePageInput, UpdatePageInput } from "@repo/contracts/schemas";
import type { Page } from "@repo/contracts/types";
import type { PageRow } from "../types/notebook.types";

export class PagesService extends BaseService<Page, PageRow> {
  constructor() {
    super("pages");
  }

  protected toContract(row: PageRow): Page {
    return {
      id: row.id,
      sectionId: row.section_id,
      notebookId: row.notebook_id,
      userId: row.user_id,
      title: row.title ?? undefined,
      content: row.content ?? undefined,
      sortOrder: row.sort_order,
      isPinned: row.is_pinned ?? false,
      isTrashed: row.is_trashed ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getBySection(
    sectionId: string,
    userId: string
  ): Promise<Page[]> {
    const rows = await db
      .select()
      .from(schema.pages)
      .where(
        and(
          eq(schema.pages.sectionId, sectionId),
          eq(schema.pages.userId, userId),
          eq(schema.pages.isTrashed, false)
        )
      )
      .orderBy(asc(schema.pages.sortOrder));

    return (rows as unknown[]).map((row) => this.toContract(rowify(schema.pages, row) as PageRow));
  }

  async createInSection(
    sectionId: string,
    notebookId: string,
    userId: string,
    dto: CreatePageInput
  ): Promise<Page> {
    const dbData: Record<string, unknown> = {
      section_id: sectionId,
      notebook_id: notebookId,
      title: dto.title?.trim() ?? "Untitled",
      content: dto.content ?? null,
    };

    return super.create(userId, dbData);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePageInput
  ): Promise<Page> {
    await this.getById(id, userId);

    const dbData: Record<string, unknown> = {};

    if (dto.title !== undefined) dbData.title = dto.title;
    if (dto.content !== undefined) dbData.content = dto.content;
    if (dto.isPinned !== undefined) dbData.is_pinned = dto.isPinned;

    return super.update(id, userId, dbData);
  }

  async togglePin(id: string, userId: string): Promise<Page> {
    const page = await this.getById(id, userId);
    return super.update(id, userId, { is_pinned: !page.isPinned });
  }
}