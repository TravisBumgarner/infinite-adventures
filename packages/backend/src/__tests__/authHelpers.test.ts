import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireUserId } from "../routes/shared/auth.js";

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe("requireUserId", () => {
  it("returns userId when req.user is set", () => {
    const req = {
      user: { authId: "auth-1", userId: "user-1", email: "gandalf@middle.earth" },
    } as AuthenticatedRequest;
    const res = createMockRes();

    const result = requireUserId(req, res);

    expect(result).toEqual({ userId: "user-1" });
  });

  it("returns null and sends 401 when req.user is not set", () => {
    const req = {} as AuthenticatedRequest;
    const res = createMockRes();

    const result = requireUserId(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
