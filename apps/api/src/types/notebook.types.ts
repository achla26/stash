export interface NotebookRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_pinned: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionRow {
  id: string;
  notebook_id: string;
  user_id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  section_id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  content: string | null;
  sort_order: number;
  is_pinned: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}