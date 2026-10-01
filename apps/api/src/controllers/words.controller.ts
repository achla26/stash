import { Context } from "hono";
import { WordsService } from "../services/words.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { createWordSchema, updateWordSchema } from "@repo/contracts/schemas";

const wordsService = new WordsService();

export class WordsController {
  static async getAll(c: Context) {
    const userId = c.get("user").id as string;
    const words = await wordsService.getAll(userId);
    return ApiResponse.success(c, words);
  }

  static async getById(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const word = await wordsService.getById(id, userId);
    return ApiResponse.success(c, word);
  }

  static async create(c: Context) {
    const userId = c.get("user").id as string;
    const body = await c.req.json();

    const parsed = createWordSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const word = await wordsService.create(userId, parsed.data);
    return ApiResponse.created(c, word, "Word saved");
  }

  static async update(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const body = await c.req.json();

    const parsed = updateWordSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const word = await wordsService.update(id, userId, parsed.data);
    return ApiResponse.success(c, word);
  }

  static async toggleMastered(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const word = await wordsService.toggleMastered(id, userId);
    return ApiResponse.success(c, word);
  }

  static async remove(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    await wordsService.permanentDelete(id, userId);
    return ApiResponse.success(c, { id });
  }
}
