// Raw DB row — exactly what Supabase returns
export interface LinkRow {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  folder_id: string | null;
  short_code: string | null;
  tags: string[];
  is_favorite: boolean;
  is_pinned: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}