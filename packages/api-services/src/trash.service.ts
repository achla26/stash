import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { TrashItem } from "@repo/contracts/types";

export function createTrashService(client: HttpClient) {
  return {
    async getTrashItems(): Promise<TrashItem[]> {
      const res = await client.get<ApiSuccessResponse<TrashItem[]>>("/api/trash");
      return (res as unknown as ApiSuccessResponse<TrashItem[]>).data ?? [];
    },

    async restoreItem(type: string, id: string): Promise<void> {
      await client.post(`/api/trash/${type}/${id}/restore`);
    },

    async permanentDeleteItem(type: string, id: string): Promise<void> {
      await client.delete(`/api/trash/${type}/${id}`);
    },

    async emptyTrash(): Promise<void> {
      await client.delete("/api/trash");
    },
  };
};
export type TrashService = ReturnType<typeof createTrashService>;
