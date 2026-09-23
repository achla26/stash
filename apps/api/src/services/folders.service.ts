import { eq, and, desc } from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { ApiError } from "../lib/api-error";
import { BaseService } from "./base.service";
import type { CreateFolderInput, UpdateFolderInput } from "@repo/contracts/schemas";
import type { Folder } from "@repo/contracts/types";
import type { FolderRow } from "../types/folder.types";

export class FoldersService extends BaseService<Folder, FolderRow> {
  constructor() {
    super("folders");
  }

  // DB row (snake_case) → Contract type (camelCase)
  protected toContract(row: FolderRow): Folder {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      parentId: row.parent_id,
      notebookId: row.notebook_id,
      isPinned: row.is_pinned ?? false,
      isTrashed: row.is_trashed ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(userId: string, dto: CreateFolderInput): Promise<Folder> {
    if (!dto.name?.trim()) {
      throw ApiError.badRequest("Folder name is required");
    }

    const dbData: Record<string, unknown> = {
      name: dto.name.trim(),
      icon: dto.icon ?? "📁",
      color: dto.color ?? null,
      type: dto.type,
      parent_id: dto.parentId ?? null,
      notebook_id: dto.notebookId ?? null,
    };

    return super.create(userId, dbData);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateFolderInput
  ): Promise<Folder> {
    await this.getById(id, userId);

    const dbData: Record<string, unknown> = {};

    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.icon !== undefined) dbData.icon = dto.icon;
    if (dto.color !== undefined) dbData.color = dto.color;
    if (dto.type !== undefined) dbData.type = dto.type;
    if (dto.parentId !== undefined) dbData.parent_id = dto.parentId;
    if (dto.notebookId !== undefined) dbData.notebook_id = dto.notebookId;

    return super.update(id, userId, dbData);
  }

  async getByType(type: string, userId: string): Promise<Folder[]> {
    try {
      const rows = await db
        .select()
        .from(schema.folders)
        .where(
          and(
            eq(schema.folders.type, type),
            eq(schema.folders.userId, userId),
            eq(schema.folders.isTrashed, false)
          )
        )
        .orderBy(desc(schema.folders.createdAt));

      return (rows as unknown[]).map((row) => this.toContract(rowify(schema.folders, row) as FolderRow));
    } catch (e) {
      const err = e as { message?: string; code?: string };
      throw ApiError.fromSupabaseError({ message: err?.message ?? "Database error", code: err?.code });
    }
  }

  private async unlinkChildren(id: string, userId: string) {
    await db
      .update(schema.links)
      .set({ folderId: null })
      .where(and(eq(schema.links.folderId, id), eq(schema.links.userId, userId)));

    await db
      .update(schema.notes)
      .set({ folderId: null })
      .where(and(eq(schema.notes.folderId, id), eq(schema.notes.userId, userId)));
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.getById(id, userId);
    await this.unlinkChildren(id, userId);
    await super.softDelete(id, userId);
  }

  async permanentDelete(id: string, userId: string): Promise<void> {
    await this.unlinkChildren(id, userId);
    await super.permanentDelete(id, userId);
  }

  async togglePin(id: string, userId: string): Promise<Folder> {
    const folder = await this.getById(id, userId);

    return super.update(id, userId, {
      is_pinned: !folder.isPinned,
    });
  }
}
