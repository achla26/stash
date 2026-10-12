import { db, schema } from "./db";
import { eq, and, count } from "drizzle-orm";
import { ApiError } from "./api-error";

export const FREE_ITEM_LIMIT = 50;
export const AI_LIMITS = { free: 10, pro: 200 } as const;

export async function getUserPlan(uid: string): Promise<string> {
  const [u] = await db
    .select({ plan: schema.users.plan })
    .from(schema.users)
    .where(eq(schema.users.id, uid));
  return u?.plan ?? "free";
}

/* Free plan: max 50 items (links + notes + pads). Pro: unlimited. */
export async function assertItemLimit(uid: string) {
  const plan = await getUserPlan(uid);
  if (plan === "pro") return;
  const [l] = await db
    .select({ n: count() })
    .from(schema.links)
    .where(and(eq(schema.links.userId, uid), eq(schema.links.isTrashed, false)));
  const [n] = await db
    .select({ n: count() })
    .from(schema.notes)
    .where(and(eq(schema.notes.userId, uid), eq(schema.notes.isTrashed, false)));
  const [p] = await db
    .select({ n: count() })
    .from(schema.pads)
    .where(eq(schema.pads.userId, uid));
  const total = (l?.n ?? 0) + (n?.n ?? 0) + (p?.n ?? 0);
  if (total >= FREE_ITEM_LIMIT) {
    throw new ApiError(
      402,
      `Free plan limit reached (${FREE_ITEM_LIMIT} items). Upgrade to Pro for unlimited storage.`,
      "LIMIT_REACHED"
    );
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* Increment today's AI chat count; throws 429 when the daily quota is used up. */
export async function consumeAiChat(uid: string) {
  const plan = await getUserPlan(uid);
  const limit = plan === "pro" ? AI_LIMITS.pro : AI_LIMITS.free;
  const day = today();
  const [row] = await db
    .select()
    .from(schema.aiUsage)
    .where(and(eq(schema.aiUsage.userId, uid), eq(schema.aiUsage.day, day)));
  const used = row?.count ?? 0;
  if (used >= limit) {
    throw new ApiError(
      429,
      plan === "pro"
        ? "Daily AI limit reached (200 chats/day). Try again tomorrow."
        : "Free daily limit reached (10 chats/day). Add your own free key in Settings for unlimited chats, or upgrade to Pro.",
      "AI_QUOTA_EXCEEDED"
    );
  }
  if (row) {
    await db
      .update(schema.aiUsage)
      .set({ count: used + 1 })
      .where(and(eq(schema.aiUsage.userId, uid), eq(schema.aiUsage.day, day)));
  } else {
    await db.insert(schema.aiUsage).values({ userId: uid, day, count: 1 });
  }
  return { used: used + 1, limit, plan };
}

export async function getAiUsage(uid: string) {
  const plan = await getUserPlan(uid);
  const limit = plan === "pro" ? AI_LIMITS.pro : AI_LIMITS.free;
  const day = today();
  const [row] = await db
    .select()
    .from(schema.aiUsage)
    .where(and(eq(schema.aiUsage.userId, uid), eq(schema.aiUsage.day, day)));
  return { used: row?.count ?? 0, limit, plan };
}
