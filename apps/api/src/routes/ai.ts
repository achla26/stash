import { Hono, type Context } from "hono";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { consumeAiChat, getAiUsage } from "../lib/plan";
import { buildStashContext, type StashSource } from "../lib/stash-context";

const ai = new Hono();

const GROQ_PREFS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant",
];

ai.get("/usage", async (c: Context) => {
  const uid = c.get("user").id as string;
  return ApiResponse.success(c, await getAiUsage(uid));
});

/* Server-side Groq proxy — backend key, per-user daily quota */
ai.post("/chat", async (c: Context) => {
  const uid = c.get("user").id as string;
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new ApiError(
      503,
      "Stash AI is not configured on this server. Add your own free key in Settings.",
      "AI_NOT_CONFIGURED"
    );
  }
  const quota = await consumeAiChat(uid);
  const body = await c.req.json<{
    messages?: { role: string; content: string }[];
    model?: string;
    useStash?: boolean;
  }>();
  if (!body.messages?.length) throw ApiError.badRequest("messages required");

  /* RAG-lite: user ke apne stash se context */
  let sources: StashSource[] = [];
  let msgs = body.messages as { role: string; content: string }[];
  if (body.useStash) {
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (lastUser) {
      const { block, sources: src } = await buildStashContext(uid, lastUser.content);
      sources = src;
      if (block) {
        const i = msgs.findIndex((m) => m.role === "system");
        if (i >= 0) {
          msgs = msgs.map((m, j) => (j === i ? { ...m, content: `${m.content}\n\n${block}` } : m));
        } else {
          msgs = [{ role: "system", content: block }, ...msgs];
        }
      }
    }
  }

  const base = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const override = process.env.GROQ_MODEL?.trim();
  const models = body.model
    ? [body.model]
    : override
      ? [override, ...GROQ_PREFS.filter((m) => m !== override)]
      : GROQ_PREFS;
  /* Free-tier TPM limits (safeguard-20b = 2000 TPM) ke liye progressive
     trimming ladder: full context → shorter history → minimal payload */
  const approxTokens = (m: { role: string; content: string }[]) =>
    Math.ceil(m.reduce((n, x) => n + x.content.length, 0) / 4);
  const stages = (m: { role: string; content: string }[]) => {
    const sys = m.filter((x) => x.role === "system");
    const rest = m.filter((x) => x.role !== "system");
    const mk = (turns: number, cutSys: boolean) => [
      ...(cutSys
        ? sys.map((x) => ({ ...x, content: x.content.slice(0, 900) }))
        : sys),
      ...rest.slice(-(turns * 2 + 1)),
    ];
    let list = [m, mk(4, false), mk(2, false), mk(1, false), mk(1, true)];
    if (approxTokens(list[0] ?? []) > 1800) list = list.slice(1);
    return list;
  };
  const TOO_BIG = /too large|tokens per minute|tpm/i;

  let lastErr = "";
  for (const model of models) {
    for (const cand of stages(msgs)) {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: cand,
        temperature: 0.4,
        reasoning_effort: "low",
        max_tokens: 1600,
      }),
    });
    if (
      r.status === 400 ||
      r.status === 404 ||
      r.status === 413 ||
      r.status === 429
    ) {
      const t = await r.text();
      lastErr = t;
      if (TOO_BIG.test(t)) continue; // payload chhota karke same model retry
      break; // model unavailable — next model
    }
    if (!r.ok) {
      throw new ApiError(
        502,
        "AI provider error. Please try again.",
        "AI_PROVIDER_ERROR"
      );
    }
    const j = (await r.json()) as {
      choices?: { message?: { content?: string; reasoning?: string } }[];
    };
    const msg = j.choices?.[0]?.message;
    const text =
      (msg?.content ?? "").trim() || (msg?.reasoning ?? "").trim() || "";
    if (!text) {
      lastErr = "empty reply";
      break; // empty answer — fall through to next model
    }
    return ApiResponse.success(c, { text, quota, model, sources });
    }
  }
  throw new ApiError(502, "No AI model available right now.", "AI_NO_MODEL");
});

export default ai;
