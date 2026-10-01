export interface Word {
  id: string;
  userId: string;
  word: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: string;
  example: string;
  synonyms: string[];
  book: string | null;
  page: number | null;
  note: string;
  mastered: boolean;
  createdAt: string;
  updatedAt: string;
}
