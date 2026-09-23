import { z } from "zod";

export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: taskPrioritySchema.optional().default("medium"),
   tags: z.array(z.string().trim().min(1)).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  isCompleted: z.boolean().optional(),
});

export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;