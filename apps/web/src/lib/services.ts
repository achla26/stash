import { apiClient } from "./api-client";
import {
  createNotesService,
  createDashboardService,
  createAuthService,
  createFolderService,
  createLinkService,
  createNotebookService,
  createPadService
} from "@repo/api-services";

export const notesService = createNotesService(apiClient as any);
export const dashboardService = createDashboardService(apiClient as any);
export const authService = createAuthService(apiClient as any);
export const folderService = createFolderService(apiClient as any);
export const linkService = createLinkService(apiClient as any);
export const notebookService = createNotebookService(apiClient as any);
export const padService = createPadService(apiClient as any);

export const exportService = {
  async getAll(): Promise<unknown> {
    const res = await apiClient.get<{ data: unknown }>("/api/export");
    return (res as { data: unknown }).data;
  },
};
