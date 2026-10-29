import { Context } from "hono";
import { UploadsService } from "../services/uploads.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";

const uploadsService = new UploadsService();

export class UploadsController {
  // POST /api/uploads — login required (auth ke baad mounted)
  static async create(c: Context) {
    const userId = c.get("user").id as string;
    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      throw ApiError.badRequest("No file provided");
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await uploadsService.create(userId, file.type, buf);
    return ApiResponse.created(c, result, "Image uploaded");
  }

  // GET /api/uploads/:id — public (auth se pehle mounted)
  static async get(c: Context) {
    const id = c.req.param("id") as string;
    const img = await uploadsService.get(id);
    c.header("Content-Type", img.mime);
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.body(new Uint8Array(img.data));
  }
}
