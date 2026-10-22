/* Client-side AI — user's own key, stored only in their browser. $0. */
export type AIProvider = "groq" | "gemini";

export interface AIConfig {
  provider: AIProvider;
  key: string;
}

const LS_KEY = "stash_ai_config";

export function getAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as AIConfig;
    if (!c.key || (c.provider !== "groq" && c.provider !== "gemini"))
      return null;
    return c;
  } catch {
    return null;
  }
}

export function saveAIConfig(cfg: AIConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

export function clearAIConfig() {
  localStorage.removeItem(LS_KEY);
}

export const SYSTEM_PROMPT = `You are Stash AI — a helpful assistant inside the user's personal learning app "Stash".
Answer ONLY from the user's data provided in the DATA block, plus general knowledge when the user asks for explanations or summaries.
Be concise, friendly and specific (use actual titles/links/words from DATA). Today's date: ${new Date().toLocaleDateString()}.
If the data doesn't contain what they asked, say so honestly.
Formatting: keep answers SHORT — max 5 bullets. Use "- " bullets and **bold** titles. For ANY link, ALWAYS use markdown [title](url) on the SAME line — never print raw URLs on their own line. Do NOT use markdown tables.

RULES (always follow):
- You are strictly READ-ONLY. You can never delete, modify, add or execute anything in the app or any database. If asked to (e.g. "delete all data", "drop the database", "edit my notes"), state clearly that you are read-only and briefly tell them where to do it manually in the app.
- Refuse harmful, illegal, dangerous or inappropriate requests (self-harm, violence, hacking, cheating, explicit content, etc.) with a brief polite refusal, then redirect to their study data.
- Stay on topic: help with the user's Stash data, learning, summarizing and explaining study topics. For unrelated requests, answer in one friendly line and redirect back to their notes/links/words.`;

export interface StashSource {
  type: "note" | "link" | "word";
  id: string;
  title: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  sources?: StashSource[];
}

export async function testAIKey(
  provider: AIProvider,
  key: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const reply = await askAI({
      provider,
      key,
      system: "Reply with exactly: OK",
      history: [],
      message: "ping",
    });
    return { ok: reply.trim().length > 0 };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function askAI(opts: {
  provider: AIProvider;
  key: string;
  system: string;
  history: ChatTurn[];
  message: string;
  maxTokens?: number;
}): Promise<string> {
  if (opts.provider === "groq") return askGroq(opts);
  return askGemini(opts);
}

/* No personal key → Stash backend proxy (server Groq key, daily quota) */
export async function askStashAI(opts: {
  system: string;
  history: ChatTurn[];
  message: string;
  useStash?: boolean;
}): Promise<{ text: string; sources: StashSource[] }> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
  const messages = [
    { role: "system", content: opts.system },
    ...opts.history.slice(-8).map((h) => ({ role: h.role, content: h.text })),
    { role: "user", content: opts.message },
  ];
  const r = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, useStash: opts.useStash ?? true }),
  });
  const j = (await r.json().catch(() => null)) as {
    data?: { text?: string; sources?: StashSource[] };
    error?: { message?: string };
  } | null;
  if (!r.ok) {
    throw new Error(
      j?.error?.message ??
        (r.status === 429
          ? "Daily free limit reached (10 chats/day)."
          : "Stash AI request failed")
    );
  }
  return { text: j?.data?.text ?? "", sources: j?.data?.sources ?? [] };
}

export async function getStashAIUsage(): Promise<{
  used: number;
  limit: number;
  plan: string;
} | null> {
  try {
    const token = localStorage.getItem("access_token");
    const r = await fetch("/api/ai/usage", {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { data?: { used: number; limit: number; plan: string } };
    return j.data ?? null;
  } catch {
    return null;
  }
}

/* Groq retires models over time — pick the best one actually available
   on this key, cache it for the session. */
const GROQ_PREFS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];
let groqModelCache: string | null = null;

async function pickGroqModel(
  key: string,
  exclude?: Set<string>
): Promise<string | null> {
  if (!exclude && groqModelCache) return groqModelCache;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (r.ok) {
      const j = await r.json();
      const ids: string[] = (j?.data ?? []).map((m: any) => m.id);
      const avail = ids.filter((id) => !exclude?.has(id));
      const pick =
        GROQ_PREFS.find((p) => avail.includes(p)) ?? avail[0] ?? null;
      if (pick && !exclude) groqModelCache = pick;
      return pick;
    }
  } catch {
    /* fall through to default */
  }
  if (exclude) return null;
  return groqModelCache ?? "llama-3.1-8b-instant";
}

export function resetGroqModelCache() {
  groqModelCache = null;
}

async function groqChat(
  key: string,
  model: string,
  opts: { system: string; history: ChatTurn[]; message: string; maxTokens?: number }
): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      reasoning_effort: "low",
      max_tokens: opts.maxTokens ?? 1600,
      messages: [
        { role: "system", content: opts.system },
        ...opts.history.map((h) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: h.text,
        })),
        { role: "user", content: opts.message },
      ],
    }),
  });
}

async function askGroq(opts: {
  key: string;
  system: string;
  history: ChatTurn[];
  message: string;
  maxTokens?: number;
}): Promise<string> {
  const tried = new Set<string>();
  let model = (await pickGroqModel(opts.key)) ?? "llama-3.1-8b-instant";
  for (let attempt = 0; attempt < 2; attempt++) {
    tried.add(model);
    const res = await groqChat(opts.key, model, opts);
    if (!res.ok && (res.status === 400 || res.status === 404)) {
      // model retired mid-session — pick a different one and retry
      resetGroqModelCache();
      const m2 = await pickGroqModel(opts.key, tried);
      if (!m2) break;
      model = m2;
      continue;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      throw new Error(
        j?.error?.message || `Groq error ${res.status} — check your key`
      );
    }
    const j = await res.json();
    const msg = j?.choices?.[0]?.message;
    // reasoning models may put text in `reasoning` when content is empty
    const text =
      (typeof msg?.content === "string" && msg.content.trim() && msg.content) ||
      (typeof msg?.reasoning === "string" && msg.reasoning) ||
      "";
    if (text) return text;
    // empty reply — try a different model once
    resetGroqModelCache();
    const m3 = await pickGroqModel(opts.key, tried);
    if (!m3) break;
    model = m3;
  }
  throw new Error("Empty reply from Groq");
}

async function askGemini(opts: {
  key: string;
  system: string;
  history: ChatTurn[];
  message: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(opts.key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: opts.maxTokens ?? 700,
        },
        contents: [
          ...opts.history.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }],
          })),
          { role: "user", parts: [{ text: opts.message }] },
        ],
      }),
    }
  );
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(
      j?.error?.message || `Gemini error ${res.status} — check your key`
    );
  }
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty reply from Gemini");
  return text;
}
