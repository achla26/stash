import { ApiError } from "../lib/api-error";
import { BaseService } from "./base.service";
import type { CreateLinkInput, UpdateLinkInput } from "@repo/contracts/schemas";
import type { Link } from "@repo/contracts/types";
import type { LinkRow } from "../types/link.types";

export class LinksService extends BaseService<Link, LinkRow> {
  constructor() {
    super("links");
  }

  // DB row → Contract type mapper
  protected toContract(row: LinkRow): Link {
    return {
      id: row.id,
      userId: row.user_id,
      url: row.url,
      title: row.title,
      description: row.description,
      image: row.image,
      favicon: row.favicon,
      folderId: row.folder_id,
      shortCode: row.short_code,
      tags: row.tags ?? [],
      isFavorite: row.is_favorite ?? false,
      isPinned: row.is_pinned ?? false,
      isTrashed: row.is_trashed ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(userId: string, dto: CreateLinkInput): Promise<Link> {
    if (!dto.url?.trim()) {
      throw ApiError.badRequest("URL is required");
    }

    try {
      new URL(dto.url);
    } catch {
      throw ApiError.badRequest("Invalid URL format");
    }

    const dbData = {
      url: dto.url.trim(),
      title: dto.title?.trim() ?? null,
      description: dto.description?.trim() ?? null,
      image: dto.image ?? null,
      favicon: dto.favicon ?? null,
      folder_id: dto.folderId ?? null,
      tags: dto.tags ?? [],
    };

    return super.create(userId, dbData);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateLinkInput
  ): Promise<Link> {
    await this.getById(id, userId);

    if (dto.url) {
      try {
        new URL(dto.url);
      } catch {
        throw ApiError.badRequest("Invalid URL format");
      }
    }

    // camelCase → snake_case for DB
    const dbData: Record<string, unknown> = {};

    if (dto.url !== undefined) dbData.url = dto.url;
    if (dto.title !== undefined) dbData.title = dto.title;
    if (dto.description !== undefined) dbData.description = dto.description;
    if (dto.image !== undefined) dbData.image = dto.image;
    if (dto.favicon !== undefined) dbData.favicon = dto.favicon;
    if (dto.folderId !== undefined) dbData.folder_id = dto.folderId;
    if (dto.tags !== undefined) dbData.tags = dto.tags;

    return super.update(id, userId, dbData);
  }

  async togglePin(id: string, userId: string): Promise<Link> {
    const link = await this.getById(id, userId);
    return super.update(id, userId, { is_pinned: !link.isPinned });
  }

  async moveLink(
    id: string,
    userId: string,
    folderId: string | null
  ): Promise<Link> {
    return super.update(id, userId, { folder_id: folderId });
  }
}
