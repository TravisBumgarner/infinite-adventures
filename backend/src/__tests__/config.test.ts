import { describe, expect, it } from "vitest";
import config from "../config.js";

describe("config", () => {
  it("exports a config object with expected keys", () => {
    expect(config).toHaveProperty("port");
    expect(config).toHaveProperty("nodeEnv");
    expect(config).toHaveProperty("dbPath");
    expect(config).toHaveProperty("supabaseUrl");
    expect(config).toHaveProperty("supabaseServiceRoleKey");
    expect(config).toHaveProperty("isProduction");
    expect(config).toHaveProperty("isDevelopment");
  });

  it("has correct default port", () => {
    expect(config.port).toBe(3021);
  });

  it("defaults to development mode", () => {
    expect(config.nodeEnv).toBe("development");
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);
  });
});
