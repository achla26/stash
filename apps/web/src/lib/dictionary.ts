/* Free dictionary sources — no keys, $0.
   Wiktionary (reliable) for meaning + dictionaryapi.dev for
   pronunciation / example / synonyms. Both run in parallel, merged. */
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
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "");

/* Wiktionary REST — response shape:
   { "en": [ { partOfSpeech, language, definitions: [ { definition } ] } ] } */
async function fromWiktionary(
  w: string
): Promise<{ meaning: string; partOfSpeech: string } | null> {
  const j = await getJson(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w.toLowerCase())}`
  );
  if (!j || typeof j !== "object") return null;
  const langs: any[] = Array.isArray(j.en)
    ? j.en
    : (Object.values(j).find((v) => Array.isArray(v)) as any[]);
  if (!Array.isArray(langs) || !langs.length) return null;
  const entry = langs[0];
  const def = entry?.definitions?.[0]?.definition;
  if (!def) return null;
  return {
    meaning: stripHtml(String(def)).trim(),
    partOfSpeech: String(entry.partOfSpeech ?? "").toLowerCase(),
  };
}

/* dictionaryapi.dev — meaning, phonetic, example, synonyms */
async function fromDictionaryApi(w: string): Promise<WordDetails | null> {
  const j = await getJson(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w.toLowerCase())}`
  );
  if (!Array.isArray(j) || !j[0]) return null;
  const e = j[0];
  const mean = e.meanings?.[0];
  const def = mean?.definitions?.[0];
  if (!def?.definition) return null;
  const syn = [...new Set([...(mean?.synonyms ?? []), ...(def?.synonyms ?? [])])].slice(0, 6);
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

export async function fetchWordDetails(w: string): Promise<WordDetails | null> {
  const [wik, dic] = await Promise.all([
    fromWiktionary(w),
    fromDictionaryApi(w),
  ]);
  const meaning = wik?.meaning || dic?.meaning || "";
  if (!meaning) return null;
  return {
    meaning,
    pronunciation: dic?.pronunciation || "",
    partOfSpeech: dic?.partOfSpeech || wik?.partOfSpeech || "",
    example: dic?.example || "",
    synonyms: dic?.synonyms || [],
  };
}
