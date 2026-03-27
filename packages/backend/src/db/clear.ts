import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://infinite:infinite@localhost:5434/infinite_adventures";

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log("Clearing all data...");

  await pool.query(
    `TRUNCATE TABLE
      canvas_item_tags, tags,
      notes, canvas_item_links, canvas_items, photos,
      people, places, things, sessions, events,
      canvas_users, canvases, users
      CASCADE`,
  );

  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log("All data cleared");
  await pool.end();
}

main().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.error("Clear failed:", err);
  process.exit(1);
});
