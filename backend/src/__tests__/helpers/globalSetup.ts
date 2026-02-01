import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://infinite:infinite@localhost:5434/infinite_adventures_test";

export async function setup() {
  const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);

  await migrate(db, {
    migrationsFolder: new URL("../../../drizzle", import.meta.url).pathname,
  });

  await pool.end();
}
