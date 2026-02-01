import type { Response } from "express";
import type { ErrorCode } from "shared";

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function sendError(res: Response, errorCode: ErrorCode, status: number): void {
  res.status(status).json({ success: false, errorCode });
}

export function sendUnauthorized(res: Response): void {
  sendError(res, "UNAUTHORIZED", 401);
}

export function sendForbidden(res: Response): void {
  sendError(res, "FORBIDDEN", 403);
}

export function sendNotFound(res: Response, errorCode: ErrorCode = "NOT_FOUND"): void {
  sendError(res, errorCode, 404);
}

export function sendBadRequest(res: Response, errorCode: ErrorCode = "INVALID_INPUT"): void {
  sendError(res, errorCode, 400);
}

export function sendInternalError(res: Response): void {
  sendError(res, "INTERNAL_ERROR", 500);
}
