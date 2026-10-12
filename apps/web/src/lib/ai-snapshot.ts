/* Builds a compact text snapshot of the user's data for the AI context. */

interface SnapLink {
  title?: string | null;
  url: string;
  createdAt: string;
}
interface SnapNote {
  title?: string | null;
  content?: string | null;
  createdAt: string;
  notebookId?: string | null;
}
interface SnapWord {
  word: string;
  meaning?: string | null;
  mastered?: boolean;
  book?: string | null;
}

const d = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

export function buildSnapshot(opts: {
  links: SnapLink[];
  notes: SnapNote[];
  words: SnapWord[];
  notebooks: { id?: string; title?: string; name?: string }[];
}): string {
  const { links, notes, words, notebooks } = opts;
  const now = Date.now();
  const week = 7 * 86400000;
  const parts: string[] = [];

  parts.push(
    `STATS: ${links.length} links (${links.filter((l) => now - +new Date(l.createdAt) < week).length} this week) · ${notes.length} notes (${notes.filter((n) => now - +new Date(n.createdAt) < week).length} this week) · ${words.length} words (${words.filter((w) => w.mastered).length} mastered) · ${notebooks.length} notebooks`
  );

  const ls = [...links]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 30);
  parts.push(
    "LINKS (newest first):\n" +
      (ls.length
        ? ls.map((l) => `- ${l.title || l.url} | ${l.url} | ${d(l.createdAt)}`).join("\n")
        : "(none)")
  );

  const ns = [...notes]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 20);
  parts.push(
    "NOTES (newest first, excerpt):\n" +
      (ns.length
        ? ns
            .map(
              (n) =>
                `- ${n.title || "Untitled"} (${d(n.createdAt)}): ${(n.content ?? "").slice(0, 500).replace(/\s+/g, " ")}`
            )
            .join("\n")
        : "(none)")
  );

  const ws = words.slice(0, 200);
  parts.push(
    "NOTEBOOKS:\n" +
      (notebooks.length
        ? notebooks
            .map((nb) => {
              const inside = notes
                .filter((n) => n.notebookId && n.notebookId === nb.id)
                .map((n) => n.title || "Untitled");
              return `- ${nb.name || nb.title || "Untitled"}${
                inside.length ? `: ${inside.join(", ")}` : " (empty)"
              }`;
            })
            .join("\n")
        : "(none)")
  );

  parts.push(
    "WORDS:\n" +
      (ws.length
        ? ws
            .map(
              (w) =>
                `- ${w.word}: ${w.meaning || "(no meaning)"}${w.mastered ? " [mastered]" : ""}${w.book ? ` [book: ${w.book}]` : ""}`
            )
            .join("\n")
        : "(none)")
  );

  let snap = parts.join("\n\n");
  if (snap.length > 14000) snap = snap.slice(0, 14000) + "\n…(truncated)";
  return snap;
}
