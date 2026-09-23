import { z } from "zod";

export const padVisibilitySchema = z.enum(["public", "password", "private"]);

export const createPadSchema = z
  .object({
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(100)
      .regex(
        /^[a-zA-Z0-9-_]+$/,
        "Slug can only contain letters, numbers, hyphens, and underscores"
      )
      .optional(),
    content: z.string().optional(),
    visibility: padVisibilitySchema.optional(),
    password: z.string().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    allowEdit: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.visibility === "password" && !data.password) return false;
      return true;
    },
    {
      message: "Password is required when visibility is set to password",
      path: ["password"],
    }
  );

export const updatePadSchema = z.object({
  content: z.string().optional(),
  visibility: padVisibilitySchema.optional(),
  password: z.string().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  allowEdit: z.boolean().optional(),
});

export type PadVisibility = z.infer<typeof padVisibilitySchema>;
export type CreatePadInput = z.infer<typeof createPadSchema>;
export type UpdatePadInput = z.infer<typeof updatePadSchema>;