import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { sendUnauthorized } from "./responses.js";

export function requireUserId(req: AuthenticatedRequest, res: Response): { userId: string } | null {
  if (!req.user) {
    sendUnauthorized(res);
    return null;
  }
  return { userId: req.user.userId };
}
