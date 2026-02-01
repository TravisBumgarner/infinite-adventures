import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, initDb } from "../db/connection.js";
import { getOrCreateUserByAuth, getUserByAuthId, getUserById } from "../db/queries/users.js";

describe("user queries", () => {
  beforeEach(() => {
    initDb(":memory:");
  });

  afterEach(() => {
    closeDb();
  });

  describe("getOrCreateUserByAuth", () => {
    it("creates a new user when none exists for the auth ID", () => {
      const user = getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });

      expect(user.auth_id).toBe("supabase-123");
      expect(user.email).toBe("gandalf@middle.earth");
      expect(user.id).toBeDefined();
    });

    it("uses email prefix as display_name when not provided", () => {
      const user = getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });

      expect(user.display_name).toBe("gandalf");
    });

    it("uses provided displayName", () => {
      const user = getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
        displayName: "Gandalf the Grey",
      });

      expect(user.display_name).toBe("Gandalf the Grey");
    });

    it("returns existing user when auth ID already exists", () => {
      const first = getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });
      const second = getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });

      expect(second.id).toBe(first.id);
    });
  });

  describe("getUserByAuthId", () => {
    it("returns undefined when no user exists", () => {
      expect(getUserByAuthId("nonexistent")).toBeUndefined();
    });

    it("returns user when found", () => {
      const created = getOrCreateUserByAuth({
        authId: "supabase-456",
        email: "frodo@shire.com",
      });

      const found = getUserByAuthId("supabase-456");
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe("frodo@shire.com");
    });
  });

  describe("getUserById", () => {
    it("returns undefined when no user exists", () => {
      expect(getUserById("nonexistent")).toBeUndefined();
    });

    it("returns user when found", () => {
      const created = getOrCreateUserByAuth({
        authId: "supabase-789",
        email: "sam@shire.com",
      });

      const found = getUserById(created.id);
      expect(found?.auth_id).toBe("supabase-789");
      expect(found?.email).toBe("sam@shire.com");
    });
  });
});
