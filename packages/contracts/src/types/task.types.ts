import type { TaskPriority, TaskStatus } from "../schemas/task.schema";

export type { TaskPriority, TaskStatus };

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus; 
  isCompleted: boolean;
  tags: string[];
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}