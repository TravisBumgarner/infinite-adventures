import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().default("http://localhost:3021/api"),
  VITE_SUPABASE_URL: z.string().default(""),
  VITE_SUPABASE_ANON_KEY: z.string().default(""),
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env?.VITE_API_URL,
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`,
  );
}

const config = {
  apiBaseUrl: parsed.data.VITE_API_URL,
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
};

export default config;
