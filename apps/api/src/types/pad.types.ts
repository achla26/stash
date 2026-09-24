// Raw DB row — exactly what Supabase returns
// Backend only — never sent to frontend
// All fields are snake_case to match DB columns exactly

export interface PadRow {
  id: string;
  slug: string;
  title: string | null;
  content: string;
  user_id: string | null;
  is_public: boolean;
  visibility: "public" | "password" | "private";
  password: string | null;
  owner_token: string | null;
  expires_at: string | null;
  allow_edit: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_edited_at: string | null;
}