import type {
  CreateFolderInput,
  UpdateFolderInput,
} from "@repo/contracts/schemas";
import type { HttpClient, ApiSuccessResponse } from "./http-client";

import type { Folder } from "@repo/contracts/types"; 

export function createFolderService(client: HttpClient) {
  return {
    async getFolders(): Promise<Folder[]> {
      const res = await client.get<ApiSuccessResponse<Folder[]>>("/api/folders");
      return (res as unknown as ApiSuccessResponse<Folder[]>).data ?? [];
    },

    async getFolderById(id: string): Promise<Folder> {
      const res = await client.get<ApiSuccessResponse<Folder>>(
        `/api/folders/${id}`
      );
      return (res as unknown as ApiSuccessResponse<Folder>).data;
    },

    async getFolderByType(type: string): Promise<Folder[]> {
      const res = await client.get<ApiSuccessResponse<Folder[]>>(
        `/api/folders/type/${type}`
      );
      return (res as unknown as ApiSuccessResponse<Folder[]>).data ?? [];
    },

    async createFolder(payload: CreateFolderInput): Promise<Folder> {
      const res = await client.post<ApiSuccessResponse<Folder>>(
        "/api/folders",
        payload
      );
      return (res as unknown as ApiSuccessResponse<Folder>).data;
    },

    async updateFolder(
      id: string,
      payload: UpdateFolderInput
    ): Promise<Folder> {
      const res = await client.patch<ApiSuccessResponse<Folder>>(
        `/api/folders/${id}`,
        payload
      );
      return (res as unknown as ApiSuccessResponse<Folder>).data;
    },

    async deleteFolder(id: string): Promise<string> {
      await client.delete(`/api/folders/${id}`);
      return id;
    },

    async restoreFolder(id: string): Promise<Folder> {
      const res = await client.patch<ApiSuccessResponse<Folder>>(
        `/api/folders/${id}/restore`
      );
      return (res as unknown as ApiSuccessResponse<Folder>).data;
    },

    async togglePin(id: string): Promise<Folder> {
      const res = await client.patch<ApiSuccessResponse<Folder>>(
        `/api/folders/${id}/pin`
      );
      return (res as unknown as ApiSuccessResponse<Folder>).data;
    },
  };
};

export type FolderService = ReturnType<typeof createFolderService>;
