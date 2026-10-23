import { apiClient } from "./api-client";
import {
  createNotesService,
  createDashboardService,
  createAuthService,
  createFolderService,
  createLinkService,
  createNotebookService,
  createPadService,
  createWordsService
} from "@repo/api-services";

export const notesService = createNotesService(apiClient as any);
export const dashboardService = createDashboardService(apiClient as any);
export const authService = createAuthService(apiClient as any);
export const folderService = createFolderService(apiClient as any);
export const linkService = createLinkService(apiClient as any);
export const notebookService = createNotebookService(apiClient as any);
export const padService = createPadService(apiClient as any);
export const wordsService = createWordsService(apiClient as any);

export const exportService = {
  async getAll(): Promise<unknown> {
    const res = await apiClient.get<{ data: unknown }>("/api/export");
    return (res as { data: unknown }).data;
  },
};

export const trashService = {
  async notes(): Promise<any[]> {
    const r = (await apiClient.get(`/api/notes/trash`)) as any;
    return r?.data ?? [];
  },
  async restoreNote(id: string): Promise<unknown> {
    return apiClient.patch(`/api/notes/${id}/restore`) as any;
  },
  async deleteNoteForever(id: string): Promise<unknown> {
    return apiClient.delete(`/api/notes/${id}/permanent`) as any;
  },
  async links(): Promise<any[]> {
    const r = (await apiClient.get(`/api/links/trash`)) as any;
    return r?.data ?? [];
  },
  async restoreLink(id: string): Promise<unknown> {
    return apiClient.post(`/api/links/${id}/restore`) as any;
  },
  async deleteLinkForever(id: string): Promise<unknown> {
    return apiClient.delete(`/api/links/${id}/permanent`) as any;
  },
};

export const bulkService = {
  async notesToTrash(ids: string[]): Promise<unknown> {
    return apiClient.post(`/api/notes/bulk/soft-delete`, { ids }) as any;
  },
  async wordsDelete(ids: string[]): Promise<unknown> {
    return apiClient.post(`/api/words/bulk/permanent-delete`, { ids }) as any;
  },
  async linksToTrash(ids: string[]): Promise<unknown> {
    return apiClient.post(`/api/links/bulk/soft-delete`, { ids }) as any;
  },
  async notesPermanent(ids: string[]): Promise<unknown> {
    return apiClient.post(`/api/notes/bulk/permanent-delete`, { ids }) as any;
  },
  async linksPermanent(ids: string[]): Promise<unknown> {
    return apiClient.post(`/api/links/bulk/permanent-delete`, { ids }) as any;
  },
};

export const notesAI = {
  async autoTag(id: string): Promise<{
    data?: { applied: string[]; known: string[]; fresh: string[]; skipped?: string };
  }> {
    return (await apiClient.post(`/api/notes/${id}/auto-tag`)) as any;
  },
  async organize(): Promise<{ data?: { updated: number; skipped: number } }> {
    return (await apiClient.post("/api/notes/organize")) as any;
  },
};
