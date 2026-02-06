import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/__tests__/helpers/globalSetup.ts",
    fileParallelism: false,
    env: {
      UPLOADS_DIR: "uploads/photos-test",
    },
  },
});
