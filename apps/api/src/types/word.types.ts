// Raw DB row — backend only, snake_case
export interface WordRow {
  id: string;
  user_id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  part_of_speech: string;
  example: string;
  synonyms: string[];
  book: string | null;
  page: number | null;
  note: string;
  mastered: boolean;
  created_at: string;
  updated_at: string;
}
