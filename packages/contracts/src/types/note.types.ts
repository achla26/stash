export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  folderId: string | null;
  isPinned: boolean;
  isTrashed: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}