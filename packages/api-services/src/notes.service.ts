import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { CreateNoteInput, UpdateNoteInput } from "@repo/contracts/schemas";
import type { Note } from "@repo/contracts/types";

export function createNotesService(client: HttpClient) {
  return {
    async getNotes(): Promise<Note[]> {
      const res = await client.get<ApiSuccessResponse<Note[]>>("/api/notes");
      return (res as unknown as ApiSuccessResponse<Note[]>).data ?? [];
    },

    async getNoteById(id: string): Promise<Note> {
      const res = await client.get<ApiSuccessResponse<Note>>(`/api/notes/${id}`);
      return (res as unknown as ApiSuccessResponse<Note>).data;
    },

    async createNote(payload: CreateNoteInput): Promise<Note> {
      const res = await client.post<ApiSuccessResponse<Note>>("/api/notes", payload);
      return (res as unknown as ApiSuccessResponse<Note>).data;
    },

    async updateNote(id: string, payload: UpdateNoteInput): Promise<Note> {
      const res = await client.patch<ApiSuccessResponse<Note>>(`/api/notes/${id}`, payload);
      return (res as unknown as ApiSuccessResponse<Note>).data;
    },

    async deleteNote(id: string): Promise<void> {
      await client.delete(`/api/notes/${id}`);
    },

    async togglePin(id: string): Promise<Note> {
      const res = await client.patch<ApiSuccessResponse<Note>>(`/api/notes/${id}/pin`);
      return (res as unknown as ApiSuccessResponse<Note>).data;
    },

    async restoreNote(id: string): Promise<Note> {
      const res = await client.patch<ApiSuccessResponse<Note>>(
        `/api/notes/${id}/restore`
      );
      return (res as unknown as ApiSuccessResponse<Note>).data;
    },

    async permanentDeleteNote(id: string): Promise<string> {
      await client.delete(`/api/notes/${id}/permanent`);
      return id;
    },
  };
}

export type NotesService = ReturnType<typeof createNotesService>;