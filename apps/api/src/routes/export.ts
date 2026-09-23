import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { ApiResponse } from "../lib/api-response";
import { AuthService } from "../services/auth.service";

const exportRouter = new Hono();

// GET /api/export — saara user data ek JSON me (backup ke liye)
exportRouter.get("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const { id: uid } = await AuthService.verifyAccessToken(token);

  const [folders, links, notes, notebooks, sections, pages, pads] =
    await Promise.all([
      db.select().from(schema.folders).where(eq(schema.folders.userId, uid)),
      db.select().from(schema.links).where(eq(schema.links.userId, uid)),
      db.select().from(schema.notes).where(eq(schema.notes.userId, uid)),
      db.select().from(schema.notebooks).where(eq(schema.notebooks.userId, uid)),
      db.select().from(schema.sections).where(eq(schema.sections.userId, uid)),
      db.select().from(schema.pages).where(eq(schema.pages.userId, uid)),
      db.select().from(schema.pads).where(eq(schema.pads.userId, uid)),
    ]);

  return ApiResponse.success(c, {
    exportedAt: new Date().toISOString(),
    app: "Stash",
    folders,
    links,
    notes,
    notebooks,
    sections,
    pages,
    pads,
  });
});

export default exportRouter;
