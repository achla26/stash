export interface TrashItem {
  id: string;
  type: "note" | "link" | "folder" | "notebook" | "task";
  title: string;
  description: string | null;
  trashedAt: string;
  icon?: string;
  color?: string;
}