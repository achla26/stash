import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: "../../apps/api/.env" });

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  ssl: {
    rejectUnauthorized: false,
  },
} satisfies Config;