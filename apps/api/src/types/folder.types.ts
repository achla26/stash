// Raw DB row — exactly what Supabase returns
// Backend only — never sent to frontend
// All fields are snake_case to match DB columns exactly

export interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "link" | "note";
  parent_id: string | null;
  is_pinned: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}