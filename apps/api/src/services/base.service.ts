import {
  eq,
  and,
  desc,
  asc,
  ilike,
  or,
  inArray,
  count,
} from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { ApiError } from "../lib/api-error";

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchField?: string;
  searchQuery?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const tables: Record<string, any> = {
  users: schema.users,
  links: schema.links,
  notes: schema.notes,
  folders: schema.folders,
  notebooks: schema.notebooks,
  sections: schema.sections,
  pages: schema.pages,
  pads: schema.pads,
};

// T = Contract type (camelCase)
// R = Raw DB row type (snake_case)
export class BaseService<T, R = T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected get table(): any {
    const t = tables[this.tableName];
    if (!t) throw new Error(`Unknown table: ${this.tableName}`);
    return t;
  }

  // snake_case column name → drizzle column ref
  protected col(name: string): any {
    const t = this.table;
    for (const key of Object.keys(t)) {
      const c = t[key];
      if (c && typeof c === "object" && c.name === name) return c;
    }
    throw new Error(`Column ${name} missing on table ${this.tableName}`);
  }

  protected has(name: string): boolean {
    try {
      this.col(name);
      return true;
    } catch {
      return false;
    }
  }

  protected rowifyRow(row: unknown): R {
    return rowify(this.table, row) as R;
  }

  // Override this in child class to map DB row → contract type
  protected toContract(row: R): T {
    return row as unknown as T;
  }

  // snake_case column name → drizzle JS prop key
  private propFor(name: string): string {
    const t = this.table;
    for (const key of Object.keys(t)) {
      const c = t[key];
      if (c && typeof c === "object" && c.name === name) return key;
    }
    return name;
  }

  private toProps(dto: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(dto)) out[this.propFor(k)] = v;
    return out;
  }

  private mapErr(e: unknown): ApiError {
    const err = e as { message?: string; code?: string; detail?: string };
    return ApiError.fromSupabaseError({
      message: err?.message ?? "Database error",
      code: err?.code,
      details: err?.detail,
    });
  }

  private ownWhere(userId: string, trashed: boolean | null = false) {
    const conds: any[] = [eq(this.col("user_id"), userId)];
    if (trashed !== null && this.has("is_trashed")) {
      conds.push(eq(this.col("is_trashed"), trashed));
    }
    return conds;
  }

  async getAll(userId: string, filters?: Record<string, unknown>): Promise<T[]> {
    try {
      const conds = this.ownWhere(userId);
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            conds.push(eq(this.col(key), value as never));
          }
        }
      }
      const rows = await db
        .select()
        .from(this.table)
        .where(and(...conds))
        .orderBy(desc(this.col("created_at")));
      return (rows as unknown[]).map((row) => this.toContract(this.rowifyRow(row)));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async getById(id: string, userId: string): Promise<T> {
    try {
      const rows = await db
        .select()
        .from(this.table)
        .where(and(eq(this.col("id"), id), eq(this.col("user_id"), userId)))
        .limit(1);

      if (!rows.length) {
        throw ApiError.notFound(`${this.tableName.slice(0, -1)} not found`);
      }
      return this.toContract(this.rowifyRow(rows[0]));
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw this.mapErr(e);
    }
  }

  async create(userId: string, dto: Record<string, unknown>): Promise<T> {
    try {
      const now = new Date();
      const values = this.toProps({ ...dto, user_id: userId });
      if (this.has("created_at")) values.created_at = now;
      if (this.has("updated_at")) values.updated_at = now;

      const rows = await db.insert(this.table).values(values).returning();
      return this.toContract(this.rowifyRow(rows[0]));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async update(
    id: string,
    userId: string,
    dto: Record<string, unknown>
  ): Promise<T> {
    await this.getById(id, userId);

    try {
      const values = this.toProps({ ...dto });
      if (this.has("updated_at")) values.updated_at = new Date();

      const rows = await db
        .update(this.table)
        .set(values)
        .where(and(eq(this.col("id"), id), eq(this.col("user_id"), userId)))
        .returning();

      return this.toContract(this.rowifyRow(rows[0]));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.getById(id, userId);
    try {
      const values = this.toProps({ is_trashed: true });
      if (this.has("updated_at")) values.updated_at = new Date();
      await db
        .update(this.table)
        .set(values)
        .where(and(eq(this.col("id"), id), eq(this.col("user_id"), userId)));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async restore(id: string, userId: string): Promise<T> {
    try {
      const values = this.toProps({ is_trashed: false });
      if (this.has("updated_at")) values.updated_at = new Date();
      const rows = await db
        .update(this.table)
        .set(values)
        .where(and(eq(this.col("id"), id), eq(this.col("user_id"), userId)))
        .returning();

      if (!rows.length) {
        throw ApiError.notFound(`${this.tableName.slice(0, -1)} not found`);
      }
      return this.toContract(this.rowifyRow(rows[0]));
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw this.mapErr(e);
    }
  }

  async permanentDelete(id: string, userId: string): Promise<void> {
    try {
      await db
        .delete(this.table)
        .where(and(eq(this.col("id"), id), eq(this.col("user_id"), userId)));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async getTrashed(userId: string): Promise<T[]> {
    try {
      const rows = await db
        .select()
        .from(this.table)
        .where(
          and(...this.ownWhere(userId, null), eq(this.col("is_trashed"), true))
        )
        .orderBy(desc(this.col("updated_at")));
      return (rows as unknown[]).map((row) => this.toContract(this.rowifyRow(row)));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async getPaginated(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<T>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortBy = params.sortBy ?? "created_at";
    const sortOrder = params.sortOrder ?? "desc";

    try {
      const conds = this.ownWhere(userId);
      if (params.searchField && params.searchQuery) {
        conds.push(
          ilike(this.col(params.searchField), `%${params.searchQuery}%`)
        );
      }
      const where = and(...conds);

      const [totalRow] = await db
        .select({ total: count() })
        .from(this.table)
        .where(where);

      const rows = await db
        .select()
        .from(this.table)
        .where(where)
        .orderBy(
          sortOrder === "asc" ? asc(this.col(sortBy)) : desc(this.col(sortBy))
        )
        .limit(limit)
        .offset(offset);

      const total = totalRow?.total ?? 0;
      return {
        data: (rows as unknown[]).map((row) => this.toContract(this.rowifyRow(row))),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async bulkSoftDelete(ids: string[], userId: string): Promise<void> {
    try {
      const values = this.toProps({ is_trashed: true });
      if (this.has("updated_at")) values.updated_at = new Date();
      await db
        .update(this.table)
        .set(values)
        .where(and(inArray(this.col("id"), ids), eq(this.col("user_id"), userId)));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async bulkPermanentDelete(ids: string[], userId: string): Promise<void> {
    try {
      await db
        .delete(this.table)
        .where(and(inArray(this.col("id"), ids), eq(this.col("user_id"), userId)));
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async count(
    userId: string,
    filters?: Record<string, unknown>
  ): Promise<number> {
    try {
      const conds = this.ownWhere(userId);
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            conds.push(eq(this.col(key), value as never));
          }
        }
      }
      const [row] = await db
        .select({ total: count() })
        .from(this.table)
        .where(and(...conds));
      return row?.total ?? 0;
    } catch (e) {
      throw this.mapErr(e);
    }
  }

  async search(
    userId: string,
    query: string,
    searchFields: string[] = ["title", "description"]
  ): Promise<T[]> {
    try {
      const fields = searchFields.filter((f) => this.has(f));
      const conds = this.ownWhere(userId);
      if (fields.length) {
        conds.push(
          or(...fields.map((f) => ilike(this.col(f), `%${query}%`)))!
        );
      }
      const rows = await db
        .select()
        .from(this.table)
        .where(and(...conds))
        .orderBy(desc(this.col("created_at")));
      return (rows as unknown[]).map((row) => this.toContract(this.rowifyRow(row)));
    } catch (e) {
      throw this.mapErr(e);
    }
  }
}
