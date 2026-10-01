/* Free dictionary sources — no keys, $0.
   Tries dictionaryapi.dev first, falls back to Wiktionary (both CORS-open). */
export interface WordDetails {
  meaning: string;
  pronunciation: string;
  partOfSpeech: string;
  example: string;
  synonyms: string[];
}

async function getJson(url: string, ms = 4000): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "");

async function fromDictionaryApi(w: string): Promise<WordDetails | null> {
  const j = await getJson(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w.toLowerCase())}`
  );
  if (!Array.isArray(j) || !j[0]) return null;
  const e = j[0];
  const mean = e.meanings?.[0];
  const def = mean?.definitions?.[0];
  if (!def?.definition) return null;
  const syn = [
    ...new Set([...(mean?.synonyms ?? []), ...(def?.synonyms ?? [])],
  )].slice(0, 6);
  return {
    meaning: def.definition,
    pronunciation:
      e.phonetic || e.phonetics?.find((p: any) => p.text)?.text || "",
    partOfSpeech: mean?.partOfSpeech || "",
    example:
      def.example ||
      mean?.definitions?.find((d: any) => d.example)?.example ||
      "",
    synonyms: syn,
  };
}

async function fromWiktionary(w: string): Promise<WordDetails | null> {
  const j = await getJson(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w.toLowerCase())}`
  );
  const defs: any[] = j?.definitions;
  if (!Array.isArray(defs) || !defs.length) return null;
  const first = defs[0];
  const meaning = stripHtml(String(first.definition ?? "")).trim();
  if (!meaning) return null;
  return {
    meaning,
    pronunciation: "",
    partOfSpeech: first.partOfSpeech || "",
    example: "",
    synonyms: [],
  };
}

export async function fetchWordDetails(w: string): Promise<WordDetails | null> {
  return (await fromDictionaryApi(w)) || (await fromWiktionary(w));
}
