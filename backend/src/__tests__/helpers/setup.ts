import { sql } from "drizzle-orm";
import { closeDb, getDb, initDb } from "../../db/connection.js";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://infinite:infinite@localhost:5434/infinite_adventures_test";

export async function setupTestDb() {
  await initDb(TEST_DATABASE_URL, { skipMigrations: true });
}

export async function teardownTestDb() {
  await closeDb();
}

export async function truncateAllTables() {
  const db = getDb();
  await db.execute(sql`TRUNCATE TABLE note_links, notes, canvases, users CASCADE`);
  await db.execute(
    sql`INSERT INTO canvases (id, name) VALUES ('00000000-0000-4000-8000-000000000000', 'Default') ON CONFLICT (id) DO NOTHING`,
  );
}
