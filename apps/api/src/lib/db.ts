export { db, sql } from "@repo/database/client";
export * as schema from "@repo/database/schema";

// drizzle camel-prop row → snake_case DB column names (contract mappers snake expect karte hain)
export function rowify(table: any, obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const out: any = {};
  for (const k of Object.keys(obj)) {
    const c = table[k];
    out[c && typeof c === "object" && c.name ? c.name : k] = obj[k];
  }
  return out;
}
