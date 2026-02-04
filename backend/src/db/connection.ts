import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let db: DrizzleDb | null = null;
let pool: pg.Pool | null = null;

export function getDb(): DrizzleDb {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

export async function initDb(
  connectionString: string = process.env.DATABASE_URL ||
    "postgresql://infinite:infinite@localhost:5434/infinite_adventures",
): Promise<DrizzleDb> {
  pool = new pg.Pool({ connectionString });
  db = drizzle(pool, { schema });

  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
