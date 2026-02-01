import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let db: DrizzleDb | null = null;
let sqlite: Database.Database | null = null;

export function getDb(): DrizzleDb {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

export function initDb(
  dbPath: string = process.env["DB_PATH"] || "./data/infinite-adventures.db"
): DrizzleDb {
  sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Create tables and FTS5 virtual table via raw SQL
  const schemaSql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  sqlite.exec(schemaSql);

  db = drizzle(sqlite, { schema });
  return db;
}

export function closeDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}
