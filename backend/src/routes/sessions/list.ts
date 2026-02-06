import type { Request, Response } from "express";
import { listSessions } from "../../services/canvasItemService.js";
import { sendSuccess } from "../shared/responses.js";

export interface ListSessionsValidationContext {
  canvasId: string;
}

export function validate(req: Request, _res: Response): ListSessionsValidationContext | null {
  const canvasIdParam = req.params.canvasId;
  const canvasId = typeof canvasIdParam === "string" ? canvasIdParam : "";
  return { canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const sessions = await listSessions(context.canvasId);
  sendSuccess(res, sessions);
}
