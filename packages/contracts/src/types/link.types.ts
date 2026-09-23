export interface Link {
  id: string;
  userId: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  folderId: string | null;
  shortCode: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}