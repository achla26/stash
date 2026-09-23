import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? undefined : val));

export const createLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, { message: "URL is required" })
    .url({ message: "Valid URL is required" }),
  title: optionalText,
  description: optionalText,
  image: z.string().optional(),
  favicon: z.string().optional(),
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export const updateLinkSchema = createLinkSchema.partial();

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;