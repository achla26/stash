import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { noteText } from "./stash-context";

const TAG_PREFS = ["openai/gpt-oss-20b", "llama-3.1-8b-instant"];

export interface AutoTagResult {
  applied: string[];
  known: string[];
  fresh: string[];
  skipped?: "too-small" | "cooldown" | "quota" | "ai-error" | "none-new";
}

async function tagLimit(userId: string): Promise<number> {
  const [u] = await db
    .select({ plan: schema.users.plan })
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  return u?.plan === "pro" ? 100000 : 30;
}

async function consumeTagQuota(userId: string, n = 1): Promise<boolean> {
  const limit = await tagLimit(userId);
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select()
    .from(schema.aiTagUsage)
    .where(
      and(
        eq(schema.aiTagUsage.userId, userId),
        eq(schema.aiTagUsage.day, sql`${today}::date`)
      )
    );
  const used = row?.count ?? 0;
  if (used + n > limit) return false;
  if (row) {
    await db
      .update(schema.aiTagUsage)
      .set({ count: used + n })
      .where(
        and(
          eq(schema.aiTagUsage.userId, userId),
          eq(schema.aiTagUsage.day, sql`${today}::date`)
        )
      );
  } else {
    await db.insert(schema.aiTagUsage).values({
      userId,
      day: sql`${today}::date`,
      count: n,
    });
  }
  return true;
}

function normalizeTag(t: string): string {
  return t
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-+#.]/g, "")
    .slice(0, 24);
}

export async function autoTagNote(
  userId: string,
  noteId: string,
  opts: { batch?: boolean } = {}
): Promise<AutoTagResult> {
  const [note] = await db
    .select()
    .from(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.userId, userId)));
  if (!note) return { applied: [], known: [], fresh: [], skipped: "none-new" };

  const text = `${note.title}\n${noteText(note.content)}`.trim();
  if (text.length < 40) {
    return { applied: [], known: [], fresh: [], skipped: "too-small" };
  }
  if (
    !opts.batch &&
    note.aiLastRun &&
    Date.now() - note.aiLastRun.getTime() < 60_000
  ) {
    return { applied: [], known: [], fresh: [], skipped: "cooldown" };
  }
  if (!(await consumeTagQuota(userId))) {
    return { applied: [], known: [], fresh: [], skipped: "quota" };
  }

  // User ka existing tag vocabulary
  const rows = await db
    .select({ tags: schema.notes.tags })
    .from(schema.notes)
    .where(eq(schema.notes.userId, userId));
  const vocab = new Set<string>();
  for (const r of rows) for (const t of r.tags ?? []) vocab.add(normalizeTag(t));

  const key = process.env.GROQ_API_KEY;
  const base = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const vocabList = [...vocab].slice(0, 40).join(", ") || "(none yet)";
  let tags: string[] = [];
  if (key) {
    for (const model of TAG_PREFS) {
      try {
        const r = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 120,
            messages: [
              {
                role: "system",
                content:
                  "You are a tagging assistant. Reply with JSON only, no prose: " +
                  '{"tags":["..."]} with 1-3 short lowercase tags for the note. ' +
                  `Prefer reusing these existing tags when they fit: ${vocabList}. ` +
                  "Otherwise invent a short lowercase hyphenated tag.",
              },
              { role: "user", content: `Title: ${note.title}\n\n${text.slice(0, 1500)}` },
            ],
          }),
        });
        if (!r.ok) continue;
        const j = (await r.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const raw = j.choices?.[0]?.message?.content ?? "";
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]) as { tags?: unknown };
          if (Array.isArray(parsed.tags)) {
            tags = parsed.tags
              .filter((t): t is string => typeof t === "string")
              .map(normalizeTag)
              .filter(Boolean);
          }
        }
        if (tags.length) break;
      } catch {
        /* try next model */
      }
    }
  }

  const have = new Set((note.tags ?? []).map(normalizeTag));
  const applied = [...new Set(tags)].filter((t) => !have.has(t)).slice(0, 3);
  await db
    .update(schema.notes)
    .set({
      ...(applied.length ? { tags: [...(note.tags ?? []), ...applied] } : {}),
      aiLastRun: new Date(),
    })
    .where(eq(schema.notes.id, noteId));

  const known = applied.filter((t) => vocab.has(t));
  const fresh = applied.filter((t) => !vocab.has(t));
  return {
    applied,
    known,
    fresh,
    skipped: applied.length ? undefined : "none-new",
  };
}

export async function organizeStash(userId: string) {
  const candidates = await db
    .select({
      id: schema.notes.id,
      tags: schema.notes.tags,
      title: schema.notes.title,
      content: schema.notes.content,
    })
    .from(schema.notes)
    .where(
      and(eq(schema.notes.userId, userId), eq(schema.notes.isTrashed, false))
    )
    .limit(120);

  const eligible = candidates.filter(
    (n) =>
      (n.tags ?? []).length === 0 && noteText(n.content).trim().length >= 40
  );

  // quota bacha hua?
  const limit = await tagLimit(userId);
  const today = new Date().toISOString().slice(0, 10);
  const [used] = await db
    .select()
    .from(schema.aiTagUsage)
    .where(
      and(
        eq(schema.aiTagUsage.userId, userId),
        eq(schema.aiTagUsage.day, sql`${today}::date`)
      )
    );
  const remaining = Math.max(0, limit - (used?.count ?? 0));

  const batch = eligible.slice(0, Math.min(6, remaining));
  const results = await Promise.all(
    batch.map((n) =>
      autoTagNote(userId, n.id, { batch: true }).then((r) => ({
        r,
        title: n.title,
      }))
    )
  );
  const tagged = results.filter((x) => x.r.applied.length).map((x) => x.title);
  return {
    updated: tagged.length,
    skipped: batch.length - tagged.length,
    tagged,
    left: eligible.length - batch.length,
  };
}
