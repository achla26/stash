import { Context } from "hono";
import { NotesService } from "../services/notes.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { createNoteSchema, updateNoteSchema } from "@repo/contracts/schemas";

const notesService = new NotesService();

export class NotesController {
  static async getAll(c: Context) {
    const userId = c.get("user").id as string;
    const notes = await notesService.getAll(userId);
    return ApiResponse.success(c, notes);
  }
  
  static async getByPublicSlug(c: Context) {
    const slug = c.req.param("slug") as string;
    const note = await notesService.getByPublicSlug(slug);
    // owner ka id public me expose nahi karna
    return ApiResponse.success(c, { ...note, userId: "" });
  }

  static async getById(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const note = await notesService.getById(id, userId);
    return ApiResponse.success(c, note);
  }

  static async create(c: Context) {
    const userId = c.get("user").id as string;
    const body = await c.req.json();

    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const note = await notesService.create(userId, parsed.data);
    return ApiResponse.created(c, note, "Note created successfully");
  }

  static async update(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const body = await c.req.json();

    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const note = await notesService.update(id, userId, parsed.data);
    return ApiResponse.success(c, note, "Note updated successfully");
  }

  static async softDelete(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    await notesService.softDelete(id, userId);
    return ApiResponse.success(c, null, "Note moved to trash");
  }

  static async restore(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const note = await notesService.restore(id, userId);
    return ApiResponse.success(c, note, "Note restored successfully");
  }

  static async permanentDelete(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    await notesService.permanentDelete(id, userId);
    return ApiResponse.noContent(c);
  }

  static async getTrashed(c: Context) {
    const userId = c.get("user").id as string;
    const notes = await notesService.getTrashed(userId);
    return ApiResponse.success(c, notes);
  }

  static async togglePin(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;

    const existing = await notesService.getById(id, userId);
    const note = await notesService.update(id, userId, {
      isPinned: !existing.isPinned,
    });

    const message = note.isPinned ? "Note pinned" : "Note unpinned";
    return ApiResponse.success(c, note, message);
  }
}