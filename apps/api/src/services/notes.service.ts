import { ApiError } from "../lib/api-error";
import { BaseService } from "./base.service";
import type { CreateNoteInput, UpdateNoteInput } from "@repo/contracts/schemas";
import type { Note } from "@repo/contracts/types";
import type { NoteRow } from "../types/note.types";

export class NotesService extends BaseService<Note, NoteRow> {
  constructor() {
    super("notes");
  }

  // DB row (snake_case) → Contract type (camelCase)
  // This is the single source of truth for this mapping
  protected toContract(row: NoteRow): Note {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      folderId: row.folder_id,
      notebookId: row.notebook_id,
      sortOrder: row.sort_order ?? 0,
      isPinned: row.is_pinned ?? false,
      isTrashed: row.is_trashed ?? false,
      tags: row.tags ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(userId: string, dto: CreateNoteInput): Promise<Note> {
    if (!dto.title?.trim()) {
      throw ApiError.badRequest("Title is required");
    }

    // camelCase input → snake_case for DB
    const dbData: Record<string, unknown> = {
      title: dto.title.trim(),
      content: dto.content ?? null,
      folder_id: dto.folderId ?? null,
      notebook_id: dto.notebookId ?? null,
      sort_order: dto.sortOrder ?? 0,
      tags: dto.tags ?? [],
    };

    return super.create(userId, dbData);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateNoteInput
  ): Promise<Note> {
    // Verify note exists and belongs to user
    await this.getById(id, userId);

    // camelCase input → snake_case for DB
    // Only include fields that were actually provided
    const dbData: Record<string, unknown> = {};

    if (dto.title !== undefined) dbData.title = dto.title;
    if (dto.content !== undefined) dbData.content = dto.content;
    if (dto.folderId !== undefined) dbData.folder_id = dto.folderId;
    if (dto.notebookId !== undefined) dbData.notebook_id = dto.notebookId;
    if (dto.sortOrder !== undefined) dbData.sort_order = dto.sortOrder;
    if (dto.isPinned !== undefined) dbData.is_pinned = dto.isPinned;
    if (dto.tags !== undefined) dbData.tags = dto.tags;

    return super.update(id, userId, dbData);
  }
}