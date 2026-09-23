export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "done"; 
  tags: string[];
  is_completed: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}