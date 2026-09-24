import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").optional(),
  content: z.string().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
  notebookId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").optional(),
  content: z.string().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
  notebookId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isPinned: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;