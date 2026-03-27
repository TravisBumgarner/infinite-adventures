// Usage: npm run db:seed
// Prerequisites: Log in to the app first so a user row exists in the DB.
// The script attaches seed data to the first user it finds.
// If no user exists, it creates a placeholder — but the data won't be
// visible until you log in and re-run the seed.

import "dotenv/config";
import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://infinite:infinite@localhost:5434/infinite_adventures";

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  // biome-ignore lint/suspicious/noConsole: CLI seed script
  console.log("Seeding database...");

  const canvasId = crypto.randomUUID();

  // Use existing user if one exists (so seed data is visible when logged in),
  // otherwise create a placeholder user
  const existingUser = await pool.query("SELECT id FROM users LIMIT 1");
  let userId: string;
  if (existingUser.rows.length > 0) {
    userId = existingUser.rows[0].id;
    // biome-ignore lint/suspicious/noConsole: CLI seed script
    console.log(`Using existing user: ${userId}`);
  } else {
    userId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO users (id, auth_id, email, display_name)
		   VALUES ($1, $2, $3, $4)
		   ON CONFLICT DO NOTHING`,
      [userId, `auth-seed-${userId}`, "dm@infinite-adventures.dev", "Dungeon Master"],
    );
    // biome-ignore lint/suspicious/noConsole: CLI seed script
    console.log("Created placeholder user (log in once first for seed data to be visible)");
  }

  await pool.query(
    `INSERT INTO canvases (id, name)
		 VALUES ($1, $2)
		 ON CONFLICT DO NOTHING`,
    [canvasId, "Tides of Fate"],
  );

  await pool.query(
    `INSERT INTO canvas_users (canvas_id, user_id)
		 VALUES ($1, $2)
		 ON CONFLICT DO NOTHING`,
    [canvasId, userId],
  );

  // --- Content rows + canvas_items ---

  const items: {
    type: string;
    title: string;
    summary: string;
    x: number;
    y: number;
    sessionDate?: string;
  }[] = [
    // People
    {
      type: "person",
      title: "Frank",
      summary: "Human cleric devoted to the god of the sea",
      x: 100,
      y: 100,
    },
    {
      type: "person",
      title: "Val",
      summary: "Female human artificer and inventor of arcane gadgets",
      x: 300,
      y: 100,
    },
    {
      type: "person",
      title: "Sinclair",
      summary: "Otter rogue with a taste for shiny things",
      x: 500,
      y: 100,
    },
    {
      type: "person",
      title: "Hadal",
      summary: "Triton druid who speaks for the deep ocean",
      x: 700,
      y: 100,
    },

    // Places
    {
      type: "place",
      title: "The Barnacle & Blade",
      summary: "A seaside tavern where adventurers trade rumors over grog",
      x: 100,
      y: 300,
    },
    {
      type: "place",
      title: "Abyssal Grotto",
      summary: "An underwater cave system teeming with bioluminescent fungi",
      x: 300,
      y: 300,
    },

    // Things
    {
      type: "thing",
      title: "Tidecaller's Conch",
      summary: "A spiral shell that can summon or calm ocean currents",
      x: 100,
      y: 500,
    },
    {
      type: "thing",
      title: "Cloak of the Depths",
      summary: "A shimmering cloak that lets the wearer breathe underwater",
      x: 300,
      y: 500,
    },
    {
      type: "thing",
      title: "Map of Sunken Reaches",
      summary: "A waterlogged chart showing routes to a lost city",
      x: 500,
      y: 500,
    },

    // Sessions
    {
      type: "session",
      title: "The Storm Gathers",
      summary: "The party met at The Barnacle & Blade during a violent storm",
      x: 100,
      y: 700,
      sessionDate: "2025-01-15",
    },
    {
      type: "session",
      title: "Into the Grotto",
      summary: "Explored the Abyssal Grotto and fought bioluminescent oozes",
      x: 300,
      y: 700,
      sessionDate: "2025-01-29",
    },
    {
      type: "session",
      title: "The Conch's Call",
      summary: "Found the Tidecaller's Conch in a merfolk shrine",
      x: 500,
      y: 700,
      sessionDate: "2025-02-12",
    },
    {
      type: "session",
      title: "Depths of Betrayal",
      summary: "Sinclair pocketed a sacred pearl, angering the merfolk",
      x: 700,
      y: 700,
      sessionDate: "2025-02-26",
    },
    {
      type: "session",
      title: "Tides Turn",
      summary: "Negotiated peace with the merfolk and gained the Cloak of the Depths",
      x: 900,
      y: 700,
      sessionDate: "2025-03-12",
    },

    // Events
    {
      type: "event",
      title: "The Sundering Tide",
      summary:
        "A massive tidal wave struck the coast, revealing the entrance to the Abyssal Grotto",
      x: 100,
      y: 900,
    },
  ];

  const contentTableMap: Record<string, string> = {
    person: "people",
    place: "places",
    thing: "things",
    session: "sessions",
    event: "events",
  };

  const canvasItemIds: Record<string, string> = {};

  for (const item of items) {
    const contentId = crypto.randomUUID();
    const canvasItemId = crypto.randomUUID();
    const table = contentTableMap[item.type];
    canvasItemIds[item.title] = canvasItemId;

    if (item.type === "session") {
      await pool.query(
        `INSERT INTO ${table} (id, session_date) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [contentId, item.sessionDate],
      );
    } else {
      await pool.query(`INSERT INTO ${table} (id) VALUES ($1) ON CONFLICT DO NOTHING`, [contentId]);
    }

    await pool.query(
      `INSERT INTO canvas_items (id, type, title, summary, canvas_x, canvas_y, canvas_id, user_id, content_id)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 ON CONFLICT DO NOTHING`,
      [
        canvasItemId,
        item.type,
        item.title,
        item.summary,
        item.x,
        item.y,
        canvasId,
        userId,
        contentId,
      ],
    );
  }

  // --- Notes ---

  const notesData: { itemTitle: string; content: string; isImportant: boolean }[] = [
    {
      itemTitle: "Frank",
      content:
        "Frank's deity is Procan, god of seas and weather. He joined the party after receiving a vision of a great tide.",
      isImportant: false,
    },
    {
      itemTitle: "Val",
      content:
        "Val's latest invention is a waterproof lantern powered by captured lightning. She's documenting everything for the Artificers' Guild.",
      isImportant: false,
    },
    {
      itemTitle: "Sinclair",
      content:
        "Sinclair claims to have been a normal otter before a wizard's experiment went awry. Nobody believes him, but nobody can prove otherwise.",
      isImportant: true,
    },
    {
      itemTitle: "The Barnacle & Blade",
      content:
        "Run by a retired pirate named Captain Greta. The grog is terrible but the rumors are priceless.",
      isImportant: false,
    },
    {
      itemTitle: "Abyssal Grotto",
      content:
        "The fungi in the grotto respond to sound — singing causes them to glow brighter, while loud noises make them go dark.",
      isImportant: true,
    },
    {
      itemTitle: "Tidecaller's Conch",
      content:
        "The conch resonates with a deep hum when pointed toward underwater magical sources. It was created by an ancient merfolk queen.",
      isImportant: false,
    },
    {
      itemTitle: "Map of Sunken Reaches",
      content: "Several routes on the map are marked with warnings in ancient Aquan script.",
      isImportant: false,
    },
    {
      itemTitle: "The Storm Gathers",
      content: "Session Zero. The players decided on a nautical campaign theme.",
      isImportant: false,
    },
    {
      itemTitle: "Depths of Betrayal",
      content:
        "Great roleplaying moment — Sinclair's player had to make a contested Wisdom save to resist pocketing the pearl.",
      isImportant: true,
    },
  ];

  for (const note of notesData) {
    await pool.query(
      `INSERT INTO notes (id, canvas_item_id, content, is_important) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), canvasItemIds[note.itemTitle], note.content, note.isImportant],
    );
  }

  // --- Links (connections between canvas items) ---

  const links: { source: string; target: string; snippet?: string }[] = [
    { source: "Frank", target: "The Barnacle & Blade", snippet: "A regular patron" },
    { source: "Hadal", target: "Abyssal Grotto", snippet: "Knows the grotto's secrets" },
    { source: "Sinclair", target: "Tidecaller's Conch", snippet: "Found in a merfolk shrine" },
    { source: "Val", target: "Cloak of the Depths", snippet: "Studied the enchantment" },
    { source: "The Sundering Tide", target: "Abyssal Grotto", snippet: "Revealed the entrance" },
    { source: "The Storm Gathers", target: "The Barnacle & Blade", snippet: "Party met here" },
    { source: "Into the Grotto", target: "Abyssal Grotto", snippet: "Explored the cave system" },
    {
      source: "The Conch's Call",
      target: "Tidecaller's Conch",
      snippet: "Retrieved from the shrine",
    },
    { source: "Tides Turn", target: "Cloak of the Depths", snippet: "Gained as a peace offering" },
    {
      source: "Map of Sunken Reaches",
      target: "Abyssal Grotto",
      snippet: "One of the charted locations",
    },
  ];

  for (const link of links) {
    await pool.query(
      `INSERT INTO canvas_item_links (source_item_id, target_item_id, snippet) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [canvasItemIds[link.source], canvasItemIds[link.target], link.snippet ?? null],
    );
  }

  // biome-ignore lint/suspicious/noConsole: CLI seed script
  console.log(
    `Seeded canvas "Tides of Fate" with ${items.length} items, ${notesData.length} notes, ${links.length} links`,
  );
  await pool.end();
}

main().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: CLI seed script
  console.error("Seed failed:", err);
  process.exit(1);
});
