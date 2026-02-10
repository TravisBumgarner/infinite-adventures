import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getOrCreateUserByAuth, getUserByAuthId, getUserById } from "../services/userService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("user queries", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("getOrCreateUserByAuth", () => {
    it("creates a new user when none exists for the auth ID", async () => {
      const user = await getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });

      expect(user.authId).toBe("supabase-123");
      expect(user.email).toBe("gandalf@middle.earth");
      expect(user.id).toBeDefined();
    });

    it("uses email prefix as displayName when not provided", async () => {
      const user = await getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });

      expect(user.displayName).toBe("gandalf");
    });

    it("uses provided displayName", async () => {
      const user = await getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
        displayName: "Gandalf the Grey",
      });

      expect(user.displayName).toBe("Gandalf the Grey");
    });

    it("returns existing user when auth ID already exists", async () => {
      const first = await getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });
      const second = await getOrCreateUserByAuth({
        authId: "supabase-123",
        email: "gandalf@middle.earth",
      });

      expect(second.id).toBe(first.id);
    });
  });

  describe("getUserByAuthId", () => {
    it("returns undefined when no user exists", async () => {
      expect(await getUserByAuthId("nonexistent")).toBeUndefined();
    });

    it("returns user when found", async () => {
      const created = await getOrCreateUserByAuth({
        authId: "supabase-456",
        email: "frodo@shire.com",
      });

      const found = await getUserByAuthId("supabase-456");
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe("frodo@shire.com");
    });
  });

  describe("getUserById", () => {
    it("returns undefined when no user exists", async () => {
      expect(await getUserById("nonexistent")).toBeUndefined();
    });

    it("returns user when found", async () => {
      const created = await getOrCreateUserByAuth({
        authId: "supabase-789",
        email: "sam@shire.com",
      });

      const found = await getUserById(created.id);
      expect(found?.authId).toBe("supabase-789");
      expect(found?.email).toBe("sam@shire.com");
    });
  });
});
