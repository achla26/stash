// Raw DB row — exactly what Supabase users table returns
// Backend only — never sent to frontend

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  avatar: string | null;
  plan: string;
  created_at: string;
  updated_at: string;
}