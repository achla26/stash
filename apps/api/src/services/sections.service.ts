import { eq, and, asc } from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { ApiError } from "../lib/api-error";
import { BaseService } from "./base.service";
import type { CreateSectionInput, UpdateSectionInput } from "@repo/contracts/schemas";
import type { Section, SectionWithPages } from "@repo/contracts/types";
import type { SectionRow, PageRow } from "../types/notebook.types";

export class SectionsService extends BaseService<Section, SectionRow> {
  constructor() {
    super("sections");
  }

  protected toContract(row: SectionRow): Section {
    return {
      id: row.id,
      notebookId: row.notebook_id,
      userId: row.user_id,
      name: row.name,
      icon: row.icon,
      sortOrder: row.sort_order,
      isTrashed: row.is_trashed ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getByNotebook(
    notebookId: string,
    userId: string
  ): Promise<SectionWithPages[]> {
    try {
      const sectionRows = await db
        .select()
        .from(schema.sections)
        .where(
          and(
            eq(schema.sections.notebookId, notebookId),
            eq(schema.sections.userId, userId),
            eq(schema.sections.isTrashed, false)
          )
        )
        .orderBy(asc(schema.sections.sortOrder));

      const sections = (sectionRows as unknown[]).map((r) => rowify(schema.sections, r) as SectionRow).map((row) =>
        this.toContract(row)
      );

      return Promise.all(
        sections.map(async (section) => {
          const pageRows = await db
            .select()
            .from(schema.pages)
            .where(
              and(
                eq(schema.pages.sectionId, section.id),
                eq(schema.pages.isTrashed, false)
              )
            )
            .orderBy(asc(schema.pages.sortOrder));

          const pages = (pageRows as unknown[]).map((r) => rowify(schema.pages, r) as PageRow).map((p) => ({
            id: p.id,
            notebookId: p.notebook_id,
            sectionId: p.section_id,
            userId: p.user_id,
            title: p.title,
            content: p.content ?? undefined,
            isTrashed: p.is_trashed ?? false,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));

          return {
            ...section,
            pages,
            pagesCount: pages.length,
          };
        })
      );
    } catch (e) {
      const err = e as { message?: string; code?: string };
      throw ApiError.fromSupabaseError({ message: err?.message ?? "Database error", code: err?.code });
    }
  }

  async createInNotebook(
    notebookId: string,
    userId: string,
    dto: CreateSectionInput
  ): Promise<Section> {
    const dbData: Record<string, unknown> = {
      notebook_id: notebookId,
      name: dto.name.trim(),
      icon: dto.icon ?? "📑",
    };

    return super.create(userId, dbData);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateSectionInput
  ): Promise<Section> {
    await this.getById(id, userId);

    const dbData: Record<string, unknown> = {};

    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.icon !== undefined) dbData.icon = dto.icon;

    return super.update(id, userId, dbData);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.getById(id, userId);

    await super.softDelete(id, userId);

    // Cascade trash pages in this section
    await db
      .update(schema.pages)
      .set({ isTrashed: true, updatedAt: new Date() })
      .where(
        and(eq(schema.pages.sectionId, id), eq(schema.pages.userId, userId))
      );
  }
}
