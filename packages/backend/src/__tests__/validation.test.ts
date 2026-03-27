import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { IdParams, parseRoute } from "../routes/shared/validation.js";

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

describe("parseRoute", () => {
  it("returns parsed params for valid UUID", () => {
    const req = createMockReq({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });
    const res = createMockRes();

    const result = parseRoute(req, res, { params: IdParams });

    expect(result).toEqual({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: undefined,
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("sends 400 INVALID_UUID for invalid params", () => {
    const req = createMockReq({ params: { id: "not-a-uuid" } });
    const res = createMockRes();

    const result = parseRoute(req, res, { params: IdParams });

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode: "INVALID_UUID" }));
  });

  it("returns parsed body when body schema provided", () => {
    const bodySchema = z.object({ name: z.string() });
    const req = createMockReq({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: { name: "Test" },
    });
    const res = createMockRes();

    const result = parseRoute(req, res, { params: IdParams, body: bodySchema });

    expect(result).toEqual({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: { name: "Test" },
    });
  });

  it("sends 400 INVALID_INPUT for invalid body", () => {
    const bodySchema = z.object({ name: z.string() });
    const req = createMockReq({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: { name: 123 },
    });
    const res = createMockRes();

    const result = parseRoute(req, res, { params: IdParams, body: bodySchema });

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode: "INVALID_INPUT" }));
  });
});
