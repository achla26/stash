export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  folderId: string | null;
  notebookId: string | null;
  sortOrder: number;
  isPinned: boolean;
  isTrashed: boolean;
  isPublic: boolean;
  publicSlug: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}