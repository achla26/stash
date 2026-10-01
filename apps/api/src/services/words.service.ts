import { BaseService } from "./base.service";
import type { CreateWordInput, UpdateWordInput } from "@repo/contracts/schemas";
import type { Word } from "@repo/contracts/types";
import type { WordRow } from "../types/word.types";

export class WordsService extends BaseService<Word, WordRow> {
  constructor() {
    super("words");
  }

  // DB row (snake_case) → Contract (camelCase)
  protected toContract(row: WordRow): Word {
    return {
      id: row.id,
      userId: row.user_id,
      word: row.word,
      meaning: row.meaning ?? "",
      pronunciation: row.pronunciation ?? "",
      partOfSpeech: row.part_of_speech ?? "",
      example: row.example ?? "",
      synonyms: row.synonyms ?? [],
      book: row.book ?? null,
      page: row.page ?? null,
      note: row.note ?? "",
      mastered: row.mastered ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(userId: string, dto: CreateWordInput): Promise<Word> {
    const dbData: Record<string, unknown> = {
      word: dto.word.trim(),
      meaning: dto.meaning ?? "",
      pronunciation: dto.pronunciation ?? "",
      part_of_speech: dto.partOfSpeech ?? "",
      example: dto.example ?? "",
      synonyms: dto.synonyms ?? [],
      book: dto.book ?? null,
      page: dto.page ?? null,
      note: dto.note ?? "",
    };
    return super.create(userId, dbData);
  }

  async update(id: string, userId: string, dto: UpdateWordInput): Promise<Word> {
    const dbData: Record<string, unknown> = {};
    if (dto.meaning !== undefined) dbData.meaning = dto.meaning;
    if (dto.pronunciation !== undefined) dbData.pronunciation = dto.pronunciation;
    if (dto.partOfSpeech !== undefined) dbData.part_of_speech = dto.partOfSpeech;
    if (dto.example !== undefined) dbData.example = dto.example;
    if (dto.synonyms !== undefined) dbData.synonyms = dto.synonyms;
    if (dto.book !== undefined) dbData.book = dto.book;
    if (dto.page !== undefined) dbData.page = dto.page;
    if (dto.note !== undefined) dbData.note = dto.note;
    return super.update(id, userId, dbData);
  }

  async toggleMastered(id: string, userId: string): Promise<Word> {
    const current = await this.getById(id, userId);
    return super.update(id, userId, { mastered: !current.mastered });
  }
}
