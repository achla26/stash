import type { CreatePadInput, UpdatePadInput } from "@repo/contracts/schemas";
import type {
  Pad,
  PadAccessResponse,
  VerifyPasswordResponse,
} from "@repo/contracts/types";
import { ApiSuccessResponse, HttpClient } from "./http-client";


export function createPadService(client: HttpClient) {
  return {
    async getPad(slug: string): Promise<PadAccessResponse> {
      const res = await client.get<ApiSuccessResponse<PadAccessResponse>>(
        `/api/pads/${slug}`
      );
      return (res as unknown as ApiSuccessResponse<PadAccessResponse>).data;
    },

    async verifyPassword(
      slug: string,
      password: string
    ): Promise<VerifyPasswordResponse> {
      const res = await client.post<ApiSuccessResponse<VerifyPasswordResponse>>(
        `/api/pads/${slug}/verify`,
        { password }
      );
      return (res as unknown as ApiSuccessResponse<VerifyPasswordResponse>).data;
    },

    async createPad(payload: CreatePadInput): Promise<Pad> {
      const res = await client.post<ApiSuccessResponse<Pad>>("/api/pads", payload);
      return (res as unknown as ApiSuccessResponse<Pad>).data;
    },

    async updatePad(slug: string, payload: UpdatePadInput): Promise<Pad> {
      const res = await client.patch<ApiSuccessResponse<Pad>>(
        `/api/pads/${slug}`,
        payload
      );
      return (res as unknown as ApiSuccessResponse<Pad>).data;
    },

    async deletePad(slug: string): Promise<void> {
      await client.delete(`/api/pads/${slug}`); // owner check on server
    },

    async getUserPads(): Promise<Pad[]> {
      const res = await client.get<ApiSuccessResponse<Pad[]>>("/api/pads/me");
      return (res as unknown as ApiSuccessResponse<Pad[]>).data ?? [];
    },
  };
}
export type PadService = ReturnType<typeof createPadService>;
