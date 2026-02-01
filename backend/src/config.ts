import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3021"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DB_PATH: z.string().default("./data/infinite-adventures.db"),
  SUPABASE_URL: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
});

const parsed = envSchema.safeParse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DB_PATH: process.env.DB_PATH,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`,
  );
}

const config = {
  port: Number.parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  dbPath: parsed.data.DB_PATH,
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  isProduction: parsed.data.NODE_ENV === "production",
  isDevelopment: parsed.data.NODE_ENV === "development",
};

export default config;
