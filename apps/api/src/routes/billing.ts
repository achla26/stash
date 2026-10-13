import { Hono, type Context } from "hono";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";

/* Public webhook + protected checkout — mounted separately in app.ts */
export const billingPublic = new Hono();
export const billingProtected = new Hono();

const dodoBase = () =>
  process.env.DODO_BASE_URL ?? "https://live.dodopayments.com";

/* ---------- POST /api/billing/checkout — server-created session with user metadata ---------- */
billingProtected.post("/checkout", async (c: Context) => {
  const uid = c.get("user").id as string;
  const productId = process.env.DODO_PRODUCT_ID;
  const key = process.env.DODO_API_KEY;
  if (!productId || !key) {
    throw new ApiError(
      503,
      "Payments are not configured on this server yet.",
      "PAYMENTS_NOT_CONFIGURED"
    );
  }
  const origin = c.req.header("origin") ?? "";
  const returnURL = `${origin}/settings?upgraded=1`;
  const r = await fetch(`${dodoBase()}/checkouts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      metadata: { user_id: uid },
      return_url: returnURL,
      cancel_url: returnURL,
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new ApiError(
      502,
      `Dodo said ${r.status}: ${t.slice(0, 200)}`,
      "CHECKOUT_FAILED"
    );
  }
  const j = (await r.json()) as { checkout_url?: string };
  if (!j.checkout_url) {
    throw new ApiError(502, "Could not start checkout. Try again.", "CHECKOUT_FAILED");
  }
  return ApiResponse.success(c, { url: j.checkout_url });
});

/* ---------- standardwebhooks-style signature check ---------- */
function verifyDodo(raw: string, headers: Headers): boolean {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) return false;
  const wid = headers.get("webhook-id") ?? "";
  const wts = headers.get("webhook-timestamp") ?? "";
  const wsig = headers.get("webhook-signature") ?? "";
  if (!wid || !wts || !wsig) return false;
  // timestamp freshness: 5 min
  const ts = Number(wts);
  if (Number.isFinite(ts) && Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const keyCandidates: Buffer[] = [];
  const s = secret.trim();
  if (s.startsWith("whsec_")) keyCandidates.push(Buffer.from(s.slice(6), "base64"));
  keyCandidates.push(Buffer.from(s, "base64"));
  keyCandidates.push(Buffer.from(s, "utf8"));
  // standardwebhooks: {id}.{ts}.{body} — Dodo examples also show {ts}.{body}
  const msgs = [`${wid}.${wts}.${raw}`, `${wts}.${raw}`];
  const provided = wsig
    .split(" ")
    .filter((p) => p.startsWith("v1,"))
    .map((p) => p.slice(3));
  for (const key of keyCandidates) {
    for (const m of msgs) {
      const expected = crypto.createHmac("sha256", key).update(m).digest("base64");
      for (const p of provided) {
        if (
          p.length === expected.length &&
          crypto.timingSafeEqual(Buffer.from(p), Buffer.from(expected))
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

/* ---------- POST /api/billing/webhook — payment.succeeded → plan = pro ---------- */
billingPublic.post("/webhook", async (c: Context) => {
  const raw = await c.req.text();
  if (!verifyDodo(raw, c.req.raw.headers)) {
    return c.json({ ok: false, error: "bad signature" }, 401);
  }
  let ev: { type?: string; data?: Record<string, unknown> };
  try {
    ev = JSON.parse(raw);
  } catch {
    return c.json({ ok: false, error: "bad json" }, 400);
  }
  if (ev.type === "payment.succeeded") {
    const data = (ev.data ?? {}) as {
      metadata?: { user_id?: string };
      customer?: { email?: string };
      customer_email?: string;
    };
    let uid = data.metadata?.user_id;
    if (!uid) {
      const email = (data.customer?.email ?? data.customer_email ?? "")
        .trim()
        .toLowerCase();
      if (email) {
        const [u] = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, email));
        uid = u?.id;
      }
    }
    if (uid) {
      await db
        .update(schema.users)
        .set({ plan: "pro" })
        .where(eq(schema.users.id, uid));
    }
  }
  return c.json({ ok: true });
});
