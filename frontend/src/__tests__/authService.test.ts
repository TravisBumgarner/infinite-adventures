import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import {
  getToken,
  getUser,
  login,
  logout,
  resetPassword,
  signup,
  updatePassword,
} from "../auth/service.js";
import { supabase } from "../lib/supabase.js";

const mockAuth = supabase!.auth as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth service", () => {
  describe("login", () => {
    it("returns success when credentials are valid", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "u1", email: "gandalf@middle.earth" } },
        error: null,
      });

      const result = await login({ email: "gandalf@middle.earth", password: "mellon" });

      expect(result).toEqual({ success: true });
    });

    it("returns error when credentials are invalid", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      const result = await login({ email: "gandalf@middle.earth", password: "wrong" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid login credentials");
      }
    });
  });

  describe("signup", () => {
    it("returns success when registration succeeds", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      });

      const result = await signup({ email: "frodo@shire.me", password: "ringbearer" });

      expect(result).toEqual({ success: true });
    });

    it("returns error when registration fails", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "User already registered" },
      });

      const result = await signup({ email: "frodo@shire.me", password: "ringbearer" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User already registered");
      }
    });
  });

  describe("getUser", () => {
    it("returns user data when session exists", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: "u1", email: "gandalf@middle.earth" } },
        error: null,
      });

      const result = await getUser();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: "u1", email: "gandalf@middle.earth" });
      }
    });

    it("returns error when no session", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getUser();

      expect(result.success).toBe(false);
    });
  });

  describe("logout", () => {
    it("returns success when logout succeeds", async () => {
      mockAuth.signOut.mockResolvedValue({ error: null });

      const result = await logout();

      expect(result).toEqual({ success: true });
    });

    it("returns error when logout fails", async () => {
      mockAuth.signOut.mockResolvedValue({ error: { message: "Network error" } });

      const result = await logout();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Network error");
      }
    });
  });

  describe("getToken", () => {
    it("returns access token when session exists", async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { access_token: "jwt-token-123" } },
        error: null,
      });

      const result = await getToken();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("jwt-token-123");
      }
    });

    it("returns error when no session", async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getToken();

      expect(result.success).toBe(false);
    });
  });

  describe("resetPassword", () => {
    it("returns success when email is sent", async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await resetPassword("gandalf@middle.earth");

      expect(result).toEqual({ success: true });
    });

    it("returns error on failure", async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        error: { message: "Rate limit exceeded" },
      });

      const result = await resetPassword("gandalf@middle.earth");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Rate limit exceeded");
      }
    });
  });

  describe("updatePassword", () => {
    it("returns success when password is updated", async () => {
      mockAuth.updateUser.mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      });

      const result = await updatePassword("new-password-123");

      expect(result).toEqual({ success: true });
    });

    it("returns error on failure", async () => {
      mockAuth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Password too short" },
      });

      const result = await updatePassword("x");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Password too short");
      }
    });
  });
});
