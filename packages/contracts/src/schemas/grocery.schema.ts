import { z } from "zod";

export const groceryStatusSchema = z.enum(["active", "completed"]);

export const addGroceryItemSchema = z.object({
  title: z.string().trim().min(1, "Item name is required").max(200),
});

export const addBulkGrocerySchema = z.object({
  items: z.array(z.string().trim().min(1)).min(1, "At least one item required"),
});

export const updateGroceryItemSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  status: groceryStatusSchema.optional(),
});

export type GroceryStatus = z.infer<typeof groceryStatusSchema>;
export type AddGroceryItemInput = z.infer<typeof addGroceryItemSchema>;
export type AddBulkGroceryInput = z.infer<typeof addBulkGrocerySchema>;
export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemSchema>;