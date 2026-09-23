import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { CreateReminderInput, UpdateReminderInput } from "@repo/contracts/schemas";
import type { Reminder } from "@repo/contracts/types";

export function createReminderService(client: HttpClient) {
  return {
    async getAll(): Promise<Reminder[]> {
      const res = await client.get<ApiSuccessResponse<Reminder[]>>("/api/reminders");
      return (res as unknown as ApiSuccessResponse<Reminder[]>).data ?? [];
    },

    async getUpcoming(): Promise<Reminder[]> {
      const res = await client.get<ApiSuccessResponse<Reminder[]>>("/api/reminders/upcoming");
      return (res as unknown as ApiSuccessResponse<Reminder[]>).data ?? [];
    },

    async getOverdue(): Promise<Reminder[]> {
      const res = await client.get<ApiSuccessResponse<Reminder[]>>("/api/reminders/overdue");
      return (res as unknown as ApiSuccessResponse<Reminder[]>).data ?? [];
    },

    async getToday(): Promise<Reminder[]> {
      const res = await client.get<ApiSuccessResponse<Reminder[]>>("/api/reminders/today");
      return (res as unknown as ApiSuccessResponse<Reminder[]>).data ?? [];
    },

    async getDue(): Promise<Reminder[]> {
      const res = await client.get<ApiSuccessResponse<Reminder[]>>("/api/reminders/due");
      return (res as unknown as ApiSuccessResponse<Reminder[]>).data ?? [];
    },

    async getById(id: string): Promise<Reminder> {
      const res = await client.get<ApiSuccessResponse<Reminder>>(`/api/reminders/${id}`);
      return (res as unknown as ApiSuccessResponse<Reminder>).data;
    },

    async create(payload: CreateReminderInput): Promise<Reminder> {
      const res = await client.post<ApiSuccessResponse<Reminder>>("/api/reminders", payload);
      return (res as unknown as ApiSuccessResponse<Reminder>).data;
    },

    async update(id: string, payload: UpdateReminderInput): Promise<Reminder> {
      const res = await client.patch<ApiSuccessResponse<Reminder>>(`/api/reminders/${id}`, payload);
      return (res as unknown as ApiSuccessResponse<Reminder>).data;
    },

    async snooze(id: string, minutes: number): Promise<Reminder> {
      const res = await client.patch<ApiSuccessResponse<Reminder>>(`/api/reminders/${id}/snooze`, { minutes });
      return (res as unknown as ApiSuccessResponse<Reminder>).data;
    },

    async markDone(id: string): Promise<Reminder> {
      const res = await client.patch<ApiSuccessResponse<Reminder>>(`/api/reminders/${id}/done`);
      return (res as unknown as ApiSuccessResponse<Reminder>).data;
    },

    async cancel(id: string): Promise<Reminder> {
      const res = await client.patch<ApiSuccessResponse<Reminder>>(`/api/reminders/${id}/cancel`);
      return (res as unknown as ApiSuccessResponse<Reminder>).data;
    },

    async deleteReminder(id: string): Promise<void> {
      await client.delete(`/api/reminders/${id}`);
    },
  };
}

export type ReminderService = ReturnType<typeof createReminderService>;