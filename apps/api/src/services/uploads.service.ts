import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { ApiError } from "../lib/api-error";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/* Allowed types + magic-byte signatures (sniffed from content, never trusted from headers) */
const SIGNATURES: { mime: string; sig: number[] }[] = [
  { mime: "image/png", sig: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", sig: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", sig: [0x47, 0x49, 0x46, 0x38] }, // "GIF8"
  { mime: "image/webp", sig: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" (WebP container)
];

function sniffMime(buf: Buffer): string | null {
  for (const { mime, sig } of SIGNATURES) {
    if (buf.length >= sig.length && sig.every((b, i) => buf[i] === b)) {
      // WebP needs the WEBP marker at bytes 8-11
      if (mime === "image/webp") {
        if (
          buf.length >= 12 &&
          buf.slice(8, 12).toString("ascii") === "WEBP"
        ) {
          return mime;
        }
        continue;
      }
      return mime;
    }
  }
  return null;
}

export class UploadsService {
  async create(userId: string, mime: string, data: Buffer): Promise<{ id: string; url: string }> {
    if (!mime.startsWith("image/")) {
      throw ApiError.badRequest("Only images are allowed");
    }
    if (data.length > MAX_BYTES) {
      throw ApiError.badRequest("Image too large (max 5MB)");
    }
    // Never trust the client-provided MIME — sniff actual bytes
    const actual = sniffMime(data);
    if (!actual) {
      throw ApiError.badRequest("Unsupported or invalid image file");
    }
    const rows = await db
      .insert(schema.noteImages)
      .values({ userId, mime: actual, data })
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
