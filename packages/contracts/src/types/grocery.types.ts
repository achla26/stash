import type { GroceryStatus } from "../schemas/grocery.schema";

export type { GroceryStatus };

export interface GroceryItem {
  id: string;
  userId: string;
  title: string;
  status: GroceryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}