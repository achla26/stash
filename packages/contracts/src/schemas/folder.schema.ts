import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(50),
  color: z.string().optional(),
  icon: z.string().optional().default("📁"),
  type: z.enum(["link", "note", "task"]),
  parentId: z.string().uuid().optional().nullable(),
  notebookId: z.string().uuid().optional().nullable(),
});

export const updateFolderSchema = createFolderSchema.partial();

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;