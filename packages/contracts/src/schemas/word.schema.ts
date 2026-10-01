import { z } from "zod";

const optionalText = z.string().trim().max(2000).optional();

export const createWordSchema = z.object({
  word: z.string().trim().min(1, { message: "Word is required" }).max(120),
  meaning: optionalText,
  pronunciation: optionalText,
  partOfSpeech: optionalText,
  example: optionalText,
  synonyms: z.array(z.string().trim().min(1)).optional(),
  book: z.string().trim().max(200).optional().nullable(),
  page: z.number().int().positive().optional().nullable(),
  note: optionalText,
});

// word name locked hai — update me baaki sab editable
export const updateWordSchema = createWordSchema.partial().omit({ word: true });

export type CreateWordInput = z.infer<typeof createWordSchema>;
export type UpdateWordInput = z.infer<typeof updateWordSchema>;
