import { eq, and } from "drizzle-orm";
import { db, schema } from "./db";

export interface StashSource {
  type: "note" | "link" | "word";
  id: string;
  title: string;
}

const STOP = new Set(
  ("the a an and or but if then else is are was were am do does did done be been being have has had having " +
    "what which how why when where who whom this that these those i you he she it we they me my mine your yours " +
    "his her hers its our ours their theirs of in on at to for from with about into onto over under after before " +
    "between during through while can could should would will shall may might must not no yes please ok okay " +
    "tell explain give show find list summarize summary write make create need want like just really very too also")
    .split(/\s+/)
);

export function extractKeywords(q: string): string[] {
  const words = q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 6)
    .map(([w]) => w);
}

/* jsonb editor content → plain text */
function noteText(content: unknown): string {
  const out: string[] = [];
  const walk = (n: unknown): void => {
    if (typeof n === "string") {
      out.push(n);
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (n && typeof n === "object") {
      const obj = n as Record<string, unknown>;
      if (typeof obj.text === "string") out.push(obj.text);
      for (const [k, v] of Object.entries(obj)) {
        if (k !== "text") walk(v);
      }
    }
  };
  try {
    walk(content);
  } catch {
    /* ignore */
  }
  return out.join(" ");
}

function snippet(text: string, kws: string[]): string {
  const lower = text.toLowerCase();
  let at = -1;
  for (const k of kws) {
    at = lower.indexOf(k);
    if (at >= 0) break;
  }
  const start = at > 90 ? at - 60 : 0;
  const clean = text.replace(/\s+/g, " ").trim();
  const slice = clean.slice(start, start + 200);
  return (start > 0 ? "…" : "") + slice + (clean.length > start + 200 ? "…" : "");
}

export async function buildStashContext(
  userId: string,
  query: string
): Promise<{ block: string; sources: StashSource[] }> {
  const kws = extractKeywords(query);
  if (kws.length === 0) return { block: "", sources: [] };
  const match = (hay: string) => {
    const h = hay.toLowerCase();
    return kws.filter((k) => h.includes(k));
  };

  const [notes, links, words] = await Promise.all([
    db
      .select({ id: schema.notes.id, title: schema.notes.title, content: schema.notes.content })
      .from(schema.notes)
      .where(and(eq(schema.notes.userId, userId), eq(schema.notes.isTrashed, false)))
      .limit(300),
    db
      .select({
        id: schema.links.id,
        title: schema.links.title,
        url: schema.links.url,
        tags: schema.links.tags,
      })
      .from(schema.links)
      .where(and(eq(schema.links.userId, userId), eq(schema.links.isTrashed, false)))
      .limit(300),
    db
      .select({
        id: schema.words.id,
        word: schema.words.word,
        meaning: schema.words.meaning,
      })
      .from(schema.words)
      .where(eq(schema.words.userId, userId))
      .limit(400),
  ]);

  type Hit = { score: number; source: StashSource; line: string };
  const hits: Hit[] = [];

  for (const n of notes) {
    const text = noteText(n.content);
    const m = match(`${n.title} ${text}`);
    if (m.length) {
      hits.push({
        score: m.length,
        source: { type: "note", id: n.id, title: n.title },
        line: `- [note] "${n.title}": ${snippet(text || n.title, kws)}`,
      });
    }
  }
  for (const l of links) {
    const hay = `${l.title ?? ""} ${l.url} ${(l.tags ?? []).join(" ")}`;
    const m = match(hay);
    if (m.length) {
      hits.push({
        score: m.length,
        source: { type: "link", id: l.id, title: l.title ?? l.url },
        line: `- [link] "${l.title ?? l.url}": ${l.url}`,
      });
    }
  }
  for (const w of words) {
    const m = match(`${w.word} ${w.meaning}`);
    if (m.length) {
      hits.push({
        score: m.length,
        source: { type: "word", id: w.id, title: w.word },
        line: `- [word] ${w.word}: ${snippet(w.meaning, kws)}`,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, 6);
  if (top.length === 0) return { block: "", sources: [] };

  let block =
    "CONTEXT FROM THE USER'S OWN STASH (private notes/links/words — use it when relevant, cite the item name):\n";
  let len = block.length;
  const lines: string[] = [];
  for (const h of top) {
    if (len + h.line.length > 2200) break;
    lines.push(h.line);
    len += h.line.length + 1;
  }
  block += lines.join("\n");
  return { block, sources: top.map((h) => h.source) };
}
