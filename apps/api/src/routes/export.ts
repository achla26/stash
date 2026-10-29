import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import { AuthService } from "../services/auth.service";
import { getUserPlan } from "../lib/plan";

const exportRouter = new Hono();

// GET /api/export?format=json|markdown — Pro feature: saara data ek file me
exportRouter.get("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const { id: uid } = await AuthService.verifyAccessToken(token);

  const plan = await getUserPlan(uid);
  if (plan !== "pro") {
    throw new ApiError(
      402,
      "Full export is a Pro feature. Upgrade to download all your data.",
      "PRO_REQUIRED"
    );
  }

  const [folders, links, notes, notebooks, pads, words] =
    await Promise.all([
      db.select().from(schema.folders).where(eq(schema.folders.userId, uid)),
      db.select().from(schema.links).where(eq(schema.links.userId, uid)),
      db.select().from(schema.notes).where(eq(schema.notes.userId, uid)),
      db.select().from(schema.notebooks).where(eq(schema.notebooks.userId, uid)),
      db.select().from(schema.pads).where(eq(schema.pads.userId, uid)),
      db.select().from(schema.words).where(eq(schema.words.userId, uid)),
    ]);

  const format = c.req.query("format") ?? "json";
  if (format === "markdown") {
    const md: string[] = [
      "# Stash Export",
      "",
      `Exported: ${new Date().toISOString()}`,
      "",
      "## Notes",
      "",
    ];
    for (const n of notes) {
      md.push(`### ${n.title}`, "");
      const raw = n.content == null ? "" : JSON.stringify(n.content);
      md.push(raw.replace(/^"/, "").replace(/"$/, "").replace(/\\n/g, "\n"), "");
    }
    md.push("## Links", "");
    for (const l of links) md.push(`- [${l.title ?? l.url}](${l.url})`);
    md.push("", "## Words", "");
    for (const w of words)
      md.push(`- **${w.word}** — ${w.meaning}${w.example ? ` (_${w.example}_)` : ""}`);
    md.push("", "## Pads", "");
    for (const p of pads) md.push(`### ${p.title ?? p.slug}`, "", p.content ?? "", "");
    c.header("Content-Type", "text/markdown; charset=utf-8");
    c.header("Content-Disposition", 'attachment; filename="stash-export.md"');
    return c.body(md.join("\n"));
  }

  return ApiResponse.success(c, {
    exportedAt: new Date().toISOString(),
    app: "Stash",
    folders,
    links,
    notes,
    notebooks,
    pads,
    words,
  });
});

export default exportRouter;
