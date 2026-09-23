import { eq, and, count } from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { ApiError } from "../lib/api-error";
import { BaseService } from "./base.service";
import type { CreateNotebookInput, UpdateNotebookInput } from "@repo/contracts/schemas";
import type { Notebook, NotebookWithCounts, NotebookWithSections } from "@repo/contracts/types";
import type { NotebookRow, SectionRow, PageRow } from "../types/notebook.types";

export class NotebooksService extends BaseService<Notebook, NotebookRow> {
  constructor() {
    super("notebooks");
  }

  protected toContract(row: NotebookRow): Notebook {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      icon: row.icon,
      coverColor: row.color,
      description: row.description,
      sortOrder: row.sort_order,
      isPinned: row.is_pinned ?? false,
      isTrashed: row.is_trashed ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAllWithCounts(userId: string): Promise<NotebookWithCounts[]> {
    const notebooks = await this.getAll(userId);

    return Promise.all(
      notebooks.map(async (notebook) => {
        const [sRow] = await db
          .select({ total: count() })
          .from(schema.sections)
          .where(
            and(
              eq(schema.sections.notebookId, notebook.id),
              eq(schema.sections.isTrashed, false)
            )
          );

        const [pRow] = await db
          .select({ total: count() })
          .from(schema.pages)
          .where(
            and(
              eq(schema.pages.notebookId, notebook.id),
              eq(schema.pages.isTrashed, false)
            )
          );

        return {
          ...notebook,
          sectionsCount: sRow?.total ?? 0,
          pagesCount: pRow?.total ?? 0,
        };
      })
    );
  }

  async create(userId: string, dto: CreateNotebookInput): Promise<Notebook> {
    const dbData: Record<string, unknown> = {
      name: dto.name.trim(),
      icon: dto.icon ?? "📓",
      color: dto.coverColor ?? "#3b82f6",
      description: dto.description ?? null,
    };

    return super.create(userId, dbData);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateNotebookInput
  ): Promise<Notebook> {
    await this.getById(id, userId);

    const dbData: Record<string, unknown> = {};

    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.icon !== undefined) dbData.icon = dto.icon;
    if (dto.coverColor !== undefined) dbData.color = dto.coverColor;
    if (dto.description !== undefined) dbData.description = dto.description;

    return super.update(id, userId, dbData);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.getById(id, userId);

    // Trash notebook
    await super.softDelete(id, userId);

    // Cascade trash to sections
    await db
      .update(schema.sections)
      .set({ isTrashed: true, updatedAt: new Date() })
      .where(
        and(eq(schema.sections.notebookId, id), eq(schema.sections.userId, userId))
      );

    // Cascade trash to pages
    await db
      .update(schema.pages)
      .set({ isTrashed: true, updatedAt: new Date() })
      .where(
        and(eq(schema.pages.notebookId, id), eq(schema.pages.userId, userId))
      );
  }

  async restore(id: string, userId: string): Promise<Notebook> {
    const notebook = await super.restore(id, userId);

    await db
      .update(schema.sections)
      .set({ isTrashed: false, updatedAt: new Date() })
      .where(
        and(eq(schema.sections.notebookId, id), eq(schema.sections.userId, userId))
      );

    await db
      .update(schema.pages)
      .set({ isTrashed: false, updatedAt: new Date() })
      .where(
        and(eq(schema.pages.notebookId, id), eq(schema.pages.userId, userId))
      );

    return notebook;
  }

  async togglePin(id: string, userId: string): Promise<Notebook> {
    const notebook = await this.getById(id, userId);
    return super.update(id, userId, { is_pinned: !notebook.isPinned });
  }

  async getWithSections(id: string, userId: string): Promise<NotebookWithSections> {
    const notebook = await this.getById(id, userId);

    const sectionRows = await db
      .select()
      .from(schema.sections)
      .where(
        and(
          eq(schema.sections.notebookId, id),
          eq(schema.sections.userId, userId),
          eq(schema.sections.isTrashed, false)
        )
      )
      .orderBy(schema.sections.sortOrder);

    const sections = await Promise.all(
      (sectionRows as unknown[]).map((r) => rowify(schema.sections, r) as SectionRow).map(async (sectionRow) => {
        const pageRows = await db
          .select()
          .from(schema.pages)
          .where(
            and(
              eq(schema.pages.sectionId, sectionRow.id),
              eq(schema.pages.isTrashed, false)
            )
          )
          .orderBy(schema.pages.sortOrder);

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
          id: sectionRow.id,
          notebookId: sectionRow.notebook_id,
          userId: sectionRow.user_id,
          name: sectionRow.name,
          icon: sectionRow.icon,
          sortOrder: sectionRow.sort_order,
          isTrashed: sectionRow.is_trashed ?? false,
          createdAt: sectionRow.created_at,
          updatedAt: sectionRow.updated_at,
          pages,
          pagesCount: pages.length,
        };
      })
    );

    return { ...notebook, sections };
  }
}
