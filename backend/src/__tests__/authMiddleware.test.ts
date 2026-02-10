import type { NextFunction, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

vi.mock("../lib/supabase.js", () => ({
  supabase: null,
}));

vi.mock("../services/userService.js", () => ({
  getOrCreateUserByAuth: vi.fn(),
}));

function createMockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    headers: {},
    ...overrides,
  } as AuthenticatedRequest;
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function createMockNext(): NextFunction {
  return vi.fn();
}

describe("requireAuth middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("when Supabase is not configured (dev mode)", () => {
    it("calls next without setting req.user", async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe("when Supabase is configured", () => {
    const mockGetUser = vi.fn();

    beforeEach(async () => {
      const supabaseMod = await import("../lib/supabase.js");
      (supabaseMod as Record<string, unknown>).supabase = {
        auth: { getUser: mockGetUser },
      };
    });

    it("returns 401 when no Authorization header is present", async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when Authorization header has no Bearer token", async () => {
      const req = createMockReq({ headers: { authorization: "Basic abc123" } });
      const res = createMockRes();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when Supabase rejects the token", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "invalid token" },
      });

      const req = createMockReq({ headers: { authorization: "Bearer bad-token" } });
      const res = createMockRes();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("sets req.user and calls next when token is valid", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "supabase-auth-id",
            email: "gandalf@middle.earth",
          },
        },
        error: null,
      });

      const { getOrCreateUserByAuth } = await import("../services/userService.js");
      vi.mocked(getOrCreateUserByAuth).mockResolvedValue({
        id: "internal-user-id",
        authId: "supabase-auth-id",
        email: "gandalf@middle.earth",
        displayName: "gandalf",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

      const req = createMockReq({ headers: { authorization: "Bearer valid-token" } });
      const res = createMockRes();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(req.user).toEqual({
        authId: "supabase-auth-id",
        userId: "internal-user-id",
        email: "gandalf@middle.earth",
      });
      expect(next).toHaveBeenCalled();
    });
  });
});
