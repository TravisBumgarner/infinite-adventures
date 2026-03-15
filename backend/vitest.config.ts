import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/__tests__/helpers/globalSetup.ts",
    fileParallelism: false,
    env: {
      UPLOADS_DIR: "uploads/photos-test",
      AWS_ACCESS_KEY_ID: "test-key-id",
      AWS_SECRET_ACCESS_KEY: "test-secret-key",
      AWS_REGION: "us-east-2",
      S3_BUCKET_NAME: "test-bucket",
    },
  },
});
