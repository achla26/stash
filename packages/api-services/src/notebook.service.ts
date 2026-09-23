import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type {
  CreateNotebookInput,
  UpdateNotebookInput,
} from "@repo/contracts/schemas";
import type {
  NotebookWithCounts,
  NotebookWithChildren,
  Notebook,
} from "@repo/contracts/types";

// ─── helper ──────────────────────────────────────────────────────────────────
function unwrap<T>(res: unknown): T {
  return (res as ApiSuccessResponse<T>).data;
}

function unwrapList<T>(res: unknown): T[] {
  return (res as ApiSuccessResponse<T[]>).data ?? [];
}

// ─── factory ─────────────────────────────────────────────────────────────────
// v2: sections/pages khatam — notebook ke andar folders + notes
export function createNotebookService(client: HttpClient) {
  return {
    /** Returns all notebooks with folder/note counts */
    async getNotebooks(): Promise<NotebookWithCounts[]> {
      const res = await client.get<ApiSuccessResponse<NotebookWithCounts[]>>(
        "/api/notebooks"
      );
      return unwrapList<NotebookWithCounts>(res);
    },

    /** Returns a single notebook WITH its folders + notes */
    async getNotebook(id: string): Promise<NotebookWithChildren> {
      const res = await client.get<ApiSuccessResponse<NotebookWithChildren>>(
        `/api/notebooks/${id}`
      );
      return unwrap<NotebookWithChildren>(res);
    },

    async createNotebook(payload: CreateNotebookInput): Promise<Notebook> {
      const res = await client.post<ApiSuccessResponse<Notebook>>(
        "/api/notebooks",
        payload
      );
      return unwrap<Notebook>(res);
    },

    async updateNotebook(
      id: string,
      payload: UpdateNotebookInput
    ): Promise<Notebook> {
      const res = await client.patch<ApiSuccessResponse<Notebook>>(
        `/api/notebooks/${id}`,
        payload
      );
      return unwrap<Notebook>(res);
    },

    /** Soft-deletes the notebook and returns its id for cache removal */
    async deleteNotebook(id: string): Promise<string> {
      await client.delete(`/api/notebooks/${id}`);
      return id;
    },
  };
}

export type NotebookService = ReturnType<typeof createNotebookService>;
