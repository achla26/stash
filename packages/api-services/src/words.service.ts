import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { CreateWordInput, UpdateWordInput } from "@repo/contracts/schemas";
import type { Word } from "@repo/contracts/types";

export function createWordsService(client: HttpClient) {
  return {
    async getWords(): Promise<Word[]> {
      const res = await client.get<ApiSuccessResponse<Word[]>>("/api/words");
      return (res as unknown as ApiSuccessResponse<Word[]>).data ?? [];
    },

    async getWordById(id: string): Promise<Word> {
      const res = await client.get<ApiSuccessResponse<Word>>(`/api/words/${id}`);
      return (res as unknown as ApiSuccessResponse<Word>).data;
    },

    async createWord(payload: CreateWordInput): Promise<Word> {
      const res = await client.post<ApiSuccessResponse<Word>>("/api/words", payload);
      return (res as unknown as ApiSuccessResponse<Word>).data;
    },

    async updateWord(id: string, payload: UpdateWordInput): Promise<Word> {
      const res = await client.patch<ApiSuccessResponse<Word>>(`/api/words/${id}`, payload);
      return (res as unknown as ApiSuccessResponse<Word>).data;
    },

    async toggleMastered(id: string): Promise<Word> {
      const res = await client.patch<ApiSuccessResponse<Word>>(`/api/words/${id}/mastered`);
      return (res as unknown as ApiSuccessResponse<Word>).data;
    },

    async deleteWord(id: string): Promise<void> {
      await client.delete(`/api/words/${id}`);
    },
  };
}

export type WordsService = ReturnType<typeof createWordsService>;
