import { eq, and, desc, count } from "drizzle-orm";
import { db, schema } from "../lib/db";
import type {
  DashboardStats,
  RecentItem,
  DashboardData,
} from "@repo/contracts/types";

export class DashboardService {
  static async getStats(userId: string): Promise<DashboardStats> {
    const [notes, links, notebooks, pads] = await Promise.all([
      db
        .select({ total: count() })
        .from(schema.notes)
        .where(
          and(eq(schema.notes.userId, userId), eq(schema.notes.isTrashed, false))
        ),
      db
        .select({ total: count() })
        .from(schema.links)
        .where(
          and(eq(schema.links.userId, userId), eq(schema.links.isTrashed, false))
        ),
      db
        .select({ total: count() })
        .from(schema.notebooks)
        .where(
          and(
            eq(schema.notebooks.userId, userId),
            eq(schema.notebooks.isTrashed, false)
          )
        ),
      db
        .select({ total: count() })
        .from(schema.pads)
        .where(eq(schema.pads.userId, userId)),
    ]);

    return {
      totalNotes: notes[0]?.total ?? 0,
      totalLinks: links[0]?.total ?? 0,
      totalNotebooks: notebooks[0]?.total ?? 0,
      totalPads: pads[0]?.total ?? 0,
    };
  }

  static async getRecent(userId: string): Promise<RecentItem[]> {
    const [notesRes, linksRes, notebooksRes] = await Promise.all([
      db
        .select({
          id: schema.notes.id,
          title: schema.notes.title,
          content: schema.notes.content,
          updatedAt: schema.notes.updatedAt,
        })
        .from(schema.notes)
        .where(
          and(eq(schema.notes.userId, userId), eq(schema.notes.isTrashed, false))
        )
        .orderBy(desc(schema.notes.updatedAt))
        .limit(5),
      db
        .select({
          id: schema.links.id,
          title: schema.links.title,
          description: schema.links.description,
          updatedAt: schema.links.updatedAt,
        })
        .from(schema.links)
        .where(
          and(eq(schema.links.userId, userId), eq(schema.links.isTrashed, false))
        )
        .orderBy(desc(schema.links.updatedAt))
        .limit(5),
      db
        .select({
          id: schema.notebooks.id,
          name: schema.notebooks.name,
          description: schema.notebooks.description,
          icon: schema.notebooks.icon,
          color: schema.notebooks.color,
          updatedAt: schema.notebooks.updatedAt,
        })
        .from(schema.notebooks)
        .where(
          and(
            eq(schema.notebooks.userId, userId),
            eq(schema.notebooks.isTrashed, false)
          )
        )
        .orderBy(desc(schema.notebooks.updatedAt))
        .limit(5),
    ]);

    const items: RecentItem[] = [];

    for (const note of notesRes) {
      items.push({
        id: note.id,
        type: "note",
        title: note.title ?? "Untitled",
        description:
          typeof note.content === "string" ? note.content.slice(0, 100) : null,
        updatedAt: note.updatedAt as unknown as string,
      });
    }

    for (const link of linksRes) {
      items.push({
        id: link.id,
        type: "link",
        title: link.title ?? "Untitled link",
        description: link.description,
        updatedAt: link.updatedAt as unknown as string,
      });
    }

    for (const nb of notebooksRes) {
      items.push({
        id: nb.id,
        type: "notebook",
        title: nb.name,
        description: nb.description,
        updatedAt: nb.updatedAt as unknown as string,
        icon: nb.icon,
        color: nb.color,
      });
    }

    items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return items.slice(0, 10);
  }

  static async getDashboard(userId: string): Promise<DashboardData> {
    const [stats, recentItems] = await Promise.all([
      this.getStats(userId),
      this.getRecent(userId),
    ]);

    return { stats, recentItems };
  }
}
