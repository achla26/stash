export interface Folder {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "link" | "note" | "task";
  parentId: string | null;
  isPinned: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}