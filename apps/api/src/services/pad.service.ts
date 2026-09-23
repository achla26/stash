import crypto from "crypto";
import { eq, desc } from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { ApiError } from "../lib/api-error";
import type { PadRow } from "../types/pad.types";
import type { Pad, PadAccessResponse, VerifyPasswordResponse } from "@repo/contracts/types";
import type { CreatePadInput, UpdatePadInput } from "@repo/contracts/schemas";

export class PadService {
  /* ===== Helpers ===== */

  private static generateSlug(): string {
    return crypto.randomBytes(4).toString("hex");
  }

  private static isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  // DB row (snake_case) → Contract type (camelCase)
  // password is NEVER included in contract type
  private static toContract(row: PadRow): Pad {
    return {
      id: row.id,
      slug: row.slug,
      content: row.content,
      visibility: row.visibility,
      userId: row.user_id,
      expiresAt: row.expires_at,
      allowEdit: row.allow_edit ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /* ===== Get Raw Row by Slug (internal only) ===== */

  private static async getRowBySlug(slug: string): Promise<PadRow | null> {
    const rows = await db
      .select()
      .from(schema.pads)
      .where(eq(schema.pads.slug, slug))
      .limit(1);

    if (!rows.length) return null;
    return rowify(schema.pads, rows[0]) as unknown as PadRow;
  }

  /* ===== Access Pad (GET /api/pads/:slug) ===== */

  static async accessPad(
    slug: string,
    userId: string | null
  ): Promise<PadAccessResponse> {
    const row = await this.getRowBySlug(slug);

    if (!row) {
      return { exists: false, isPasswordProtected: false, data: null };
    }

    if (this.isExpired(row.expires_at)) {
      return {
        exists: true,
        isPasswordProtected: false,
        data: null,
        error: "Pad has expired",
        statusCode: 410,
      };
    }

    const isOwner = !!(userId && row.user_id === userId);
    const isAnonymousPad = !row.user_id;

    // Anonymous pad
    if (isAnonymousPad) {
      return {
        exists: true,
        isPasswordProtected: row.visibility === "password",
        data: row.visibility === "password" ? null : this.toContract(row),
        canEdit: false,
        isAnonymous: true,
      };
    }

    // Private pad
    if (row.visibility === "private") {
      if (!isOwner) {
        return {
          exists: true,
          isPasswordProtected: false,
          data: null,
          error: "This pad is private",
          statusCode: 403,
        };
      }
      return {
        exists: true,
        isPasswordProtected: false,
        data: this.toContract(row),
        canEdit: true,
      };
    }

    // Password protected pad
    if (row.visibility === "password") {
      if (isOwner) {
        return {
          exists: true,
          isPasswordProtected: false,
          data: this.toContract(row),
          canEdit: true,
        };
      }
      return {
        exists: true,
        isPasswordProtected: true,
        data: null,
        canEdit: false,
      };
    }

    // Public pad
    const canEdit = isOwner || row.allow_edit === true;

    return {
      exists: true,
      isPasswordProtected: false,
      data: this.toContract(row),
      canEdit,
    };
  }

  /* ===== Verify Password (POST /api/pads/:slug/verify) ===== */

  static async verifyPassword(
    slug: string,
    password: string
  ): Promise<VerifyPasswordResponse> {
    if (!password) {
      throw ApiError.badRequest("Password is required");
    }

    const row = await this.getRowBySlug(slug);

    if (!row) {
      throw ApiError.notFound("Pad not found");
    }

    if (this.isExpired(row.expires_at)) {
      throw new ApiError(410, "Pad has expired", "PAD_EXPIRED");
    }

    if (row.password !== password) {
      throw ApiError.unauthorized("Wrong password");
    }

    const canEdit = row.visibility === "password" && row.allow_edit === true;

    return {
      pad: this.toContract(row),
      canEdit,
    };
  }

  /* ===== Create Pad ===== */

  static async create(
    dto: CreatePadInput,
    userId: string | null
  ): Promise<Pad> {
    let slug = dto.slug?.trim();

    let visibility = dto.visibility;
    let allowEdit = false;
    let password = dto.password ?? null;

    if (userId) {
      // Authenticated user
      if (!visibility) {
        visibility = "private";
      }
      allowEdit = dto.allowEdit ?? false;

      if (visibility === "password" && !password) {
        throw ApiError.badRequest(
          "Password is required for password-protected pads"
        );
      }
    } else {
      // Anonymous user
      if (visibility === "private") {
        visibility = "public";
      }
      if (!visibility) {
        visibility = "public";
      }
      allowEdit = false;

      if (visibility === "password" && !password) {
        throw ApiError.badRequest(
          "Password is required for password-protected pads"
        );
      }
    }

    // Slug handling
    if (slug) {
      const existing = await this.getRowBySlug(slug);
      if (existing) {
        throw ApiError.conflict("This URL already exists");
      }
    } else {
      slug = this.generateSlug();
    }

    const rows = await db
      .insert(schema.pads)
      .values({
        slug,
        content: dto.content ?? "",
        userId,
        visibility: visibility as never,
        password,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        allowEdit,
      } as never)
      .returning();

    return this.toContract(rowify(schema.pads, rows[0]) as unknown as PadRow);
  }

  /* ===== Update Pad ===== */

  static async update(
    slug: string,
    dto: UpdatePadInput,
    userId: string | null
  ): Promise<Pad> {
    const row = await this.getRowBySlug(slug);
    if (!row) throw ApiError.notFound("Pad not found");

    if (this.isExpired(row.expires_at)) {
      throw new ApiError(410, "Pad has expired", "PAD_EXPIRED");
    }

    if (!row.user_id) {
      throw ApiError.forbidden("Anonymous pads cannot be edited");
    }

    const isOwner = !!userId && row.user_id === userId;

    if (!isOwner) {
      let canCollaborate = false;

      // Public + allowEdit
      if (row.visibility === "public" && row.allow_edit === true) {
        canCollaborate = true;
      }

      // Password protected + allowEdit
      // Note: password verification happens via /verify endpoint first
      if (row.visibility === "password" && row.allow_edit === true) {
        canCollaborate = true;
      }

      if (!canCollaborate) {
        throw ApiError.forbidden("No permission to edit");
      }

      // Non-owner can only edit content — not settings
      const hasSettingsChange =
        dto.visibility !== undefined ||
        dto.expiresAt !== undefined ||
        dto.allowEdit !== undefined;

      if (hasSettingsChange) {
        throw ApiError.forbidden("Only owner can change pad settings");
      }
    }

    // Build update data — camelCase input → snake_case for DB
    const updateData: Record<string, unknown> = {};

    // Content — anyone with edit permission can update
    if (dto.content !== undefined) updateData.content = dto.content;

    // Owner-only fields
    if (isOwner) {
      if (dto.visibility !== undefined) updateData.visibility = dto.visibility;
      if (dto.password !== undefined) updateData.password = dto.password;
      if (dto.expiresAt !== undefined) updateData.expires_at = dto.expiresAt;
      if (dto.allowEdit !== undefined) updateData.allow_edit = dto.allowEdit;
    }

    const updatedRow = await this.performUpdate(slug, updateData);
    return this.toContract(updatedRow);
  }

  /* ===== Perform Update (internal) ===== */

  private static async performUpdate(
    slug: string,
    updateData: Record<string, unknown>
  ): Promise<PadRow> {
    // snake_case keys → drizzle camel props
    const propMap: Record<string, string> = {
      content: "content",
      visibility: "visibility",
      password: "password",
      expires_at: "expiresAt",
      allow_edit: "allowEdit",
    };
    const setObj: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(updateData)) {
      const prop = propMap[k];
      if (prop) setObj[prop] = v;
    }

    const rows = await db
      .update(schema.pads)
      .set(setObj)
      .where(eq(schema.pads.slug, slug))
      .returning();

    return rowify(schema.pads, rows[0]) as unknown as PadRow;
  }

  /* ===== Delete Pad ===== */

  static async delete(slug: string, userId: string): Promise<void> {
    const row = await this.getRowBySlug(slug);

    if (!row) {
      throw ApiError.notFound("Pad not found");
    }

    if (!row.user_id || row.user_id !== userId) {
      throw ApiError.forbidden("Only the owner can delete this pad");
    }

    await db.delete(schema.pads).where(eq(schema.pads.slug, slug));
  }

  /* ===== Get User's Pads ===== */

  static async getUserPads(userId: string): Promise<Pad[]> {
    const rows = await db
      .select()
      .from(schema.pads)
      .where(eq(schema.pads.userId, userId))
      .orderBy(desc(schema.pads.createdAt));

    return (rows as unknown[]).map((row) => this.toContract(rowify(schema.pads, row) as PadRow));
  }
}