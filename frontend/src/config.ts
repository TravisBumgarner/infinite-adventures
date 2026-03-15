import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().default("/api"),
  VITE_SUPABASE_URL: z.string(),
  VITE_SUPABASE_ANON_KEY: z.string(),
  VITE_POSTHOG_API_KEY: z.string(),
  VITE_POSTHOG_HOST: z.string(),
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env?.VITE_API_URL,
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY,
  VITE_POSTHOG_API_KEY: import.meta.env?.VITE_POSTHOG_API_KEY,
  VITE_POSTHOG_HOST: import.meta.env?.VITE_POSTHOG_HOST,
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
  posthogApiKey: parsed.data.VITE_POSTHOG_API_KEY,
  posthogHost: parsed.data.VITE_POSTHOG_HOST,
};

export default config;
