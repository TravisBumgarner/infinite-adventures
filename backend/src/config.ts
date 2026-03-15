import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3021"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string()
    .default("postgresql://infinite:infinite@localhost:5434/infinite_adventures"),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z.string(),
  FRONTEND_URL: z.string(),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  UPLOADS_DIR: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  S3_BUCKET_NAME: z.string(),
  POSTHOG_API_KEY: z.string(),
  POSTHOG_HOST: z.string(),
});

const parsed = envSchema.safeParse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL_REJECT_UNAUTHORIZED: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  FRONTEND_URL: process.env.FRONTEND_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  UPLOADS_DIR: process.env.UPLOADS_DIR,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`,
  );
}

const config = {
  port: Number.parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  databaseSslRejectUnauthorized: parsed.data.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
  frontendUrl: parsed.data.FRONTEND_URL,
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  uploadsDir: parsed.data.UPLOADS_DIR,
  awsAccessKeyId: parsed.data.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: parsed.data.AWS_SECRET_ACCESS_KEY,
  awsRegion: parsed.data.AWS_REGION,
  s3BucketName: parsed.data.S3_BUCKET_NAME,
  posthogApiKey: parsed.data.POSTHOG_API_KEY,
  posthogHost: parsed.data.POSTHOG_HOST,
  isProduction: parsed.data.NODE_ENV === "production",
  isDevelopment: parsed.data.NODE_ENV === "development",
};

export default config;
