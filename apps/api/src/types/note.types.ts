// Raw DB row — exactly what Supabase returns
// Backend only — never sent to frontend
// All fields are snake_case to match DB columns exactly

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  folder_id: string | null;
  notebook_id: string | null;
  sort_order: number;
  tags:string[];
  is_pinned: boolean;
  is_trashed: boolean;
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
}