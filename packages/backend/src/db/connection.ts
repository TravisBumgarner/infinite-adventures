import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import config from "../config.js";
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

export async function initDb(connectionString: string = config.databaseUrl): Promise<DrizzleDb> {
  const poolConfig: pg.PoolConfig = { connectionString };

  if (config.isProduction) {
    poolConfig.ssl = { rejectUnauthorized: config.databaseSslRejectUnauthorized };
  }

  pool = new pg.Pool(poolConfig);
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
