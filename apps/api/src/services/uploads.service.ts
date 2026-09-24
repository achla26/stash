import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { ApiError } from "../lib/api-error";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export class UploadsService {
  async create(userId: string, mime: string, data: Buffer): Promise<{ id: string; url: string }> {
    if (!mime.startsWith("image/")) {
      throw ApiError.badRequest("Only images are allowed");
    }
    if (data.length > MAX_BYTES) {
      throw ApiError.badRequest("Image too large (max 5MB)");
    }
    const rows = await db
      .insert(schema.noteImages)
      .values({ userId, mime, data })
      .returning({ id: schema.noteImages.id });
    const id = rows[0]!.id;
    return { id, url: `/api/uploads/${id}` };
  }

  async get(id: string): Promise<{ mime: string; data: Buffer }> {
    const rows = await db
      .select({ mime: schema.noteImages.mime, data: schema.noteImages.data })
      .from(schema.noteImages)
      .where(eq(schema.noteImages.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) throw ApiError.notFound("Image not found");
    return row;
  }
}
