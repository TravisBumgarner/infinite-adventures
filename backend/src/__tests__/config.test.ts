import { describe, expect, it } from "vitest";
import config from "../config.js";

describe("config", () => {
  it("exports a config object with expected keys", () => {
    expect(config).toHaveProperty("port");
    expect(config).toHaveProperty("nodeEnv");
    expect(config).toHaveProperty("databaseUrl");
    expect(config).toHaveProperty("supabaseUrl");
    expect(config).toHaveProperty("supabaseServiceRoleKey");
    expect(config).toHaveProperty("isProduction");
    expect(config).toHaveProperty("isDevelopment");
  });

  it("has correct default port", () => {
    expect(config.port).toBe(3021);
  });

  it("is not production when NODE_ENV is not production", () => {
    // vitest sets NODE_ENV=test, so we verify the derived flags are consistent
    expect(config.isProduction).toBe(false);
    expect(config.nodeEnv).not.toBe("production");
  });
});
