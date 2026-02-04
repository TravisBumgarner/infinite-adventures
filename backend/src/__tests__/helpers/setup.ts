import { sql } from "drizzle-orm";
import { closeDb, getDb, initDb } from "../../db/connection.js";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://infinite:infinite@localhost:5434/infinite_adventures_test";

export const TEST_USER_ID = "test-user-0000-0000-000000000001";
export const TEST_USER_AUTH_ID = "auth-test-0000-0000-000000000001";

export async function setupTestDb() {
  await initDb(TEST_DATABASE_URL);
}

export async function teardownTestDb() {
  await closeDb();
}

export async function truncateAllTables() {
  const db = getDb();
  await db.execute(
    sql`TRUNCATE TABLE
      canvas_item_links, canvas_items, photos,
      people, places, things, sessions, events,
      note_links, notes, canvas_users, canvases, users
      CASCADE`,
  );
  await db.execute(
    sql`INSERT INTO users (id, auth_id, email, display_name) VALUES (${TEST_USER_ID}, ${TEST_USER_AUTH_ID}, 'test@example.com', 'Test User') ON CONFLICT (id) DO NOTHING`,
  );
  await db.execute(
    sql`INSERT INTO canvases (id, name) VALUES ('00000000-0000-4000-8000-000000000000', 'Default') ON CONFLICT (id) DO NOTHING`,
  );
  await db.execute(
    sql`INSERT INTO canvas_users (canvas_id, user_id) VALUES ('00000000-0000-4000-8000-000000000000', ${TEST_USER_ID}) ON CONFLICT (canvas_id, user_id) DO NOTHING`,
  );
}
