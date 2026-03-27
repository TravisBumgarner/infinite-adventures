import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env["DATABASE_URL"] ||
      "postgresql://infinite:infinite@localhost:5434/infinite_adventures",
  },
});
