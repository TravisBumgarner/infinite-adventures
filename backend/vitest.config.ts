import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/__tests__/helpers/globalSetup.ts",
    fileParallelism: false,
    env: {
      PORT: "3021",
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://infinite:infinite@localhost:5434/infinite_adventures_test",
      DATABASE_SSL_REJECT_UNAUTHORIZED: "false",
      FRONTEND_URL: "http://localhost:5177",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      AWS_ACCESS_KEY_ID: "test-key-id",
      AWS_SECRET_ACCESS_KEY: "test-secret-key",
      AWS_REGION: "us-east-2",
      S3_BUCKET_NAME: "test-bucket",
      POSTHOG_API_KEY: "phc_test",
      POSTHOG_HOST: "https://test.posthog.com",
      CLOUDFLARE_TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
});
