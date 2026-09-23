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

// ===== Section =====

export const createSectionSchema = z.object({
  name: z.string().trim().min(1, "Section name is required").max(100),
  icon: z.string().optional().default("📑"),
});

export const updateSectionSchema = createSectionSchema.partial();

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// ===== Page =====

export const createPageSchema = z.object({
  title: z.string().trim().min(1, "Page title is required").max(200).optional(),
  content: z.string().optional().nullable(),
});

export const updatePageSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;