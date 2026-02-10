import "dotenv/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://infinite:infinite@localhost:5434/infinite_adventures";

const pool = new Pool({
  connectionString: databaseUrl,
});

const db = drizzle(pool);

async function main() {
  // biome-ignore lint/suspicious/noConsole: CLI migration script
  console.log("Running migrations...");
  // In dev (tsx): __dirname is backend/src/db, drizzle is at backend/drizzle
  // In prod (bundled): __dirname is backend/dist/db, drizzle is at backend/drizzle
  const isDev = __dirname.endsWith("src/db") || __dirname.endsWith("src\\db");
  const migrationsFolder = isDev
    ? resolve(__dirname, "..", "..", "drizzle")
    : resolve(__dirname, "..", "..", "drizzle");
  await migrate(db, { migrationsFolder });
  // biome-ignore lint/suspicious/noConsole: CLI migration script
  console.log("Migrations complete");
  await pool.end();
}

main().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: CLI migration script
  console.error("Migration failed:", err);
  process.exit(1);
});
