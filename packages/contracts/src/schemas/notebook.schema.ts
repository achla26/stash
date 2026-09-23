import { z } from "zod";

// ===== Notebook =====

export const createNotebookSchema = z.object({
  name: z.string().trim().min(1, "Notebook name is required").max(100),
  icon: z.string().optional().default("📓"),
  coverColor: z.string().optional().default("#3b82f6"),
  description: z.string().optional().nullable(),
});

export const updateNotebookSchema = createNotebookSchema.partial();

export type CreateNotebookInput = z.infer<typeof createNotebookSchema>;
export type UpdateNotebookInput = z.infer<typeof updateNotebookSchema>;
