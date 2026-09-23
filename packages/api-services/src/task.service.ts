import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { CreateTaskInput, UpdateTaskInput } from "@repo/contracts/schemas";
import type { Task } from "@repo/contracts/types";

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export function createTaskService(client: HttpClient) {
  return {
    async getTasks(): Promise<Task[]> {
      const res = await client.get<ApiSuccessResponse<Task[]>>("/api/tasks");
      return (res as unknown as ApiSuccessResponse<Task[]>).data ?? [];
    },

    async getTaskById(id: string): Promise<Task> {
      const res = await client.get<ApiSuccessResponse<Task>>(`/api/tasks/${id}`);
      return (res as unknown as ApiSuccessResponse<Task>).data;
    },

    async createTask(payload: CreateTaskInput): Promise<Task> {
      const res = await client.post<ApiSuccessResponse<Task>>("/api/tasks", payload);
      return (res as unknown as ApiSuccessResponse<Task>).data;
    },

    async updateTask(id: string, payload: UpdateTaskInput): Promise<Task> {
      const res = await client.patch<ApiSuccessResponse<Task>>(`/api/tasks/${id}`, payload);
      return (res as unknown as ApiSuccessResponse<Task>).data;
    },

    async toggleTask(id: string): Promise<Task> {
      const res = await client.patch<ApiSuccessResponse<Task>>(`/api/tasks/${id}/toggle`);
      return (res as unknown as ApiSuccessResponse<Task>).data;
    },

    async deleteTask(id: string): Promise<void> {
      await client.delete(`/api/tasks/${id}`);
    },

    async getStats(): Promise<TaskStats> {
      const res = await client.get<ApiSuccessResponse<TaskStats>>("/api/tasks/stats");
      return (res as unknown as ApiSuccessResponse<TaskStats>).data;
    },
  };
}

export type TaskService = ReturnType<typeof createTaskService>;