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
export interface NotebookWithCounts extends Notebook {
  sectionsCount: number;
  pagesCount: number;
}

export interface NotebookWithSections extends Notebook {
  sections: SectionWithPages[];
}


export interface Section {
  id: string;
  notebookId: string;
  userId: string;
  name: string;
  icon?: string | null;
  sortOrder?: number;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  pages?: Page[];           
}


export interface Page {
  id: string;
  notebookId: string;
  sectionId: string;
  userId: string;
  title: string;
  content?: string;
  sortOrder?: number;
  isPinned?: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}



export interface SectionWithPages extends Section {
  pages: Page[];
  pagesCount: number;
}

