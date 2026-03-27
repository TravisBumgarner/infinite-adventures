import * as fs from "node:fs";
import * as path from "node:path";
import pg from "pg";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://infinite:infinite@localhost:5434/infinite_adventures_test";

export async function setup() {
  const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL });

  // Drop and recreate public schema so migrations always run on a clean DB.
  await pool.query("DROP SCHEMA public CASCADE");
  await pool.query("CREATE SCHEMA public");

  // Run migration SQL directly (drizzle migrator has path resolution issues in vitest globalSetup)
  const migrationsDir = path.resolve(process.cwd(), "drizzle");
  const journal = JSON.parse(
    fs.readFileSync(path.join(migrationsDir, "meta", "_journal.json"), "utf8"),
  );

  for (const entry of journal.entries) {
    const sqlFile = path.join(migrationsDir, `${entry.tag}.sql`);
    const sql = fs.readFileSync(sqlFile, "utf8");
    const statements = sql.split("--> statement-breakpoint");
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed) await pool.query(trimmed);
    }
  }

  await pool.end();
}
