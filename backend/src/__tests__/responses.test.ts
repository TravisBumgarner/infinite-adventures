import { describe, expect, it, vi } from "vitest";
import {
  sendBadRequest,
  sendError,
  sendForbidden,
  sendInternalError,
  sendNotFound,
  sendSuccess,
  sendUnauthorized,
} from "../routes/shared/responses.js";

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as import("express").Response;
}

describe("sendSuccess", () => {
  it("sends { success: true, data } with status 200 by default", () => {
    const res = createMockResponse();
    sendSuccess(res, { id: "abc" });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "abc" } });
  });

  it("allows a custom status code", () => {
    const res = createMockResponse();
    sendSuccess(res, { id: "abc" }, 201);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("sendError", () => {
  it("sends { success: false, errorCode } with the given status", () => {
    const res = createMockResponse();
    sendError(res, "NOT_FOUND", 404);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "NOT_FOUND" });
  });
});

describe("sendUnauthorized", () => {
  it("sends 401 with UNAUTHORIZED", () => {
    const res = createMockResponse();
    sendUnauthorized(res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "UNAUTHORIZED" });
  });
});

describe("sendForbidden", () => {
  it("sends 403 with FORBIDDEN", () => {
    const res = createMockResponse();
    sendForbidden(res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "FORBIDDEN" });
  });
});

describe("sendNotFound", () => {
  it("sends 404 with NOT_FOUND by default", () => {
    const res = createMockResponse();
    sendNotFound(res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "NOT_FOUND" });
  });

  it("allows a custom error code", () => {
    const res = createMockResponse();
    sendNotFound(res, "NOTE_NOT_FOUND");

    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "NOTE_NOT_FOUND" });
  });
});

describe("sendBadRequest", () => {
  it("sends 400 with INVALID_INPUT by default", () => {
    const res = createMockResponse();
    sendBadRequest(res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "INVALID_INPUT" });
  });

  it("allows a custom error code", () => {
    const res = createMockResponse();
    sendBadRequest(res, "INVALID_UUID");

    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "INVALID_UUID" });
  });
});

describe("sendInternalError", () => {
  it("sends 500 with INTERNAL_ERROR", () => {
    const res = createMockResponse();
    sendInternalError(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, errorCode: "INTERNAL_ERROR" });
  });
});
