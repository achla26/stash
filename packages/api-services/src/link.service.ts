import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { CreateLinkInput, UpdateLinkInput } from "@repo/contracts/schemas";
import type { Link } from "@repo/contracts/types";

export function createLinkService(client: HttpClient) {
  return {
    async getLinks(): Promise<Link[]> {
      const res = await client.get<ApiSuccessResponse<Link[]>>("/api/links");
      return (res as unknown as ApiSuccessResponse<Link[]>).data ?? [];
    },

    async getLinkById(id: string): Promise<Link> {
      const res = await client.get<ApiSuccessResponse<Link>>(`/api/links/${id}`);
      return (res as unknown as ApiSuccessResponse<Link>).data;
    },

    async fetchMeta(url: string): Promise<{ title?: string; description?: string; favicon?: string; siteName?: string }> {
      const res = await client.post<ApiSuccessResponse<any>>("/api/links/fetch-meta", { url });
      return (res as unknown as ApiSuccessResponse<any>).data ?? {};
    },

    async createLink(payload: CreateLinkInput): Promise<Link> {
      const res = await client.post<ApiSuccessResponse<Link>>("/api/links", payload);
      return (res as unknown as ApiSuccessResponse<Link>).data;
    },

    async updateLink(id: string, payload: UpdateLinkInput): Promise<Link> {
      const res = await client.patch<ApiSuccessResponse<Link>>(
        `/api/links/${id}`,
        payload
      );
      return (res as unknown as ApiSuccessResponse<Link>).data;
    },

    async deleteLink(id: string): Promise<string> {
      await client.delete(`/api/links/${id}`);
      return id;
    },

    async togglePin(id: string): Promise<Link> {
      const res = await client.post<ApiSuccessResponse<Link>>(
        `/api/links/${id}/toggle-pin`,
        {}
      );
      return (res as unknown as ApiSuccessResponse<Link>).data;
    },

    async moveLink(id: string, folderId: string | null): Promise<Link> {
      const res = await client.post<ApiSuccessResponse<Link>>(
        `/api/links/${id}/move`,
        { folderId }
      );
      return (res as unknown as ApiSuccessResponse<Link>).data;
    },
  };
};
export type LinkService = ReturnType<typeof createLinkService>;
