import { Hono, type Context } from "hono";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { consumeAiChat, getAiUsage } from "../lib/plan";

const ai = new Hono();

const GROQ_PREFS = [ 
  "llama-3.3-70b-versatile",
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
  }>();
  if (!body.messages?.length) throw ApiError.badRequest("messages required");

  const base = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const override = process.env.GROQ_MODEL?.trim();
  const models = body.model
    ? [body.model]
    : override
      ? [override, ...GROQ_PREFS.filter((m) => m !== override)]
      : GROQ_PREFS;
  let lastErr = "";
  for (const model of models) {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature: 0.4,
        reasoning_effort: "low",
        max_tokens: 1600,
      }),
    });
    if (r.status === 400 || r.status === 404) {
      lastErr = await r.text();
      continue; // model unavailable — try next
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
      continue; // empty answer — fall through to next model
    }
    return ApiResponse.success(c, { text, quota, model });
  }
  throw new ApiError(502, "No AI model available right now.", "AI_NO_MODEL");
});

export default ai;
