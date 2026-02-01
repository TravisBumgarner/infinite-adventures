import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
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
  options?: { skipMigrations?: boolean },
): Promise<DrizzleDb> {
  pool = new pg.Pool({ connectionString });
  db = drizzle(pool, { schema });

  if (!options?.skipMigrations) {
    await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
  }

  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
