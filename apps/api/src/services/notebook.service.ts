import { eq, and, count, asc } from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { BaseService } from "./base.service";
import type { CreateNotebookInput, UpdateNotebookInput } from "@repo/contracts/schemas";
import type { Notebook, NotebookWithCounts, NotebookWithChildren } from "@repo/contracts/types";
import type { NotebookRow } from "../types/notebook.types";
import type { FolderRow } from "../types/folder.types";
import type { NoteRow } from "../types/note.types";

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
        const [fRow] = await db
          .select({ total: count() })
          .from(schema.folders)
          .where(
            and(
              eq(schema.folders.notebookId, notebook.id),
              eq(schema.folders.isTrashed, false)
            )
          );

        const [nRow] = await db
          .select({ total: count() })
          .from(schema.notes)
          .where(
            and(
              eq(schema.notes.notebookId, notebook.id),
              eq(schema.notes.isTrashed, false)
            )
          );

        return {
          ...notebook,
          foldersCount: fRow?.total ?? 0,
          notesCount: nRow?.total ?? 0,
        };
      })
    );
  }

  // v2: sections/pages ki jagah folders + notes
  async getWithChildren(id: string, userId: string): Promise<NotebookWithChildren> {
    const notebook = await this.getById(id, userId);

    const folderRows = await db
      .select()
      .from(schema.folders)
      .where(
        and(
          eq(schema.folders.notebookId, id),
          eq(schema.folders.userId, userId),
          eq(schema.folders.isTrashed, false)
        )
      )
      .orderBy(asc(schema.folders.sortOrder));

    const noteRows = await db
      .select()
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.notebookId, id),
          eq(schema.notes.userId, userId),
          eq(schema.notes.isTrashed, false)
        )
      )
      .orderBy(asc(schema.notes.sortOrder));

    const folders = (folderRows as unknown[])
      .map((r) => rowify(schema.folders, r) as FolderRow)
      .map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        type: row.type as "link" | "note" | "task",
        parentId: row.parent_id,
        notebookId: row.notebook_id,
        isPinned: row.is_pinned ?? false,
        isTrashed: row.is_trashed ?? false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

    const notes = (noteRows as unknown[])
      .map((r) => rowify(schema.notes, r) as NoteRow)
      .map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        folderId: row.folder_id,
        notebookId: row.notebook_id,
        sortOrder: row.sort_order ?? 0,
        isPinned: row.is_pinned ?? false,
        isTrashed: row.is_trashed ?? false,
        isPublic: row.is_public ?? false,
        publicSlug: row.public_slug ?? null,
        tags: row.tags ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

    return { ...notebook, folders, notes };
  }

  async togglePin(id: string, userId: string): Promise<Notebook> {
    const notebook = await this.getById(id, userId);
    return super.update(id, userId, {
      is_pinned: !notebook.isPinned,
    });
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
}
