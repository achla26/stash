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
If the data doesn't contain what they asked, say so honestly.`;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
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
      maxTokens: 10,
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

/* Groq retires models over time — pick the best one actually available
   on this key, cache it for the session. */
const GROQ_PREFS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];
let groqModelCache: string | null = null;

async function pickGroqModel(key: string): Promise<string> {
  if (groqModelCache) return groqModelCache;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (r.ok) {
      const j = await r.json();
      const ids: string[] = (j?.data ?? []).map((m: any) => m.id);
      const pick = GROQ_PREFS.find((p) => ids.includes(p)) ?? ids[0];
      if (pick) groqModelCache = pick;
    }
  } catch {
    /* fall through to default */
  }
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
      max_tokens: opts.maxTokens ?? 700,
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
  let model = await pickGroqModel(opts.key);
  let res = await groqChat(opts.key, model, opts);
  if (!res.ok && (res.status === 400 || res.status === 404)) {
    // model retired mid-session — repick and retry once
    resetGroqModelCache();
    const m2 = await pickGroqModel(opts.key);
    if (m2 !== model) {
      model = m2;
      res = await groqChat(opts.key, model, opts);
    }
  }
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(
      j?.error?.message || `Groq error ${res.status} — check your key`
    );
  }
  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty reply from Groq");
  return text;
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
