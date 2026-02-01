import { describe, expect, it } from "vitest";
import config from "../config";

describe("frontend config", () => {
  it("exports apiBaseUrl with default value", () => {
    expect(config.apiBaseUrl).toBe("http://localhost:3021/api");
  });

  it("exports supabaseUrl", () => {
    expect(config).toHaveProperty("supabaseUrl");
  });

  it("exports supabaseAnonKey", () => {
    expect(config).toHaveProperty("supabaseAnonKey");
  });
});
