export interface GroceryItemRow {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "completed";
  sort_order: number;
  created_at: string;
  updated_at: string;
}