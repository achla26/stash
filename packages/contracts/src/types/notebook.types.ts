import type { Folder } from "./folder.types";
import type { Note } from "./note.types";

export interface Notebook {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  coverColor: string;
  icon?: string | null;
  sortOrder?: number;
  isPinned: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

// v2: sections/pages khatam — notebook ke andar folders + notes
export interface NotebookWithCounts extends Notebook {
  foldersCount: number;
  notesCount: number;
}

export interface NotebookWithChildren extends Notebook {
  folders: Folder[];
  notes: Note[];
}
