import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { listSessions } from "../../services/canvasItemService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export interface ListSessionsValidationContext {
  canvasId: string;
}

export function validate(req: Request, res: Response): ListSessionsValidationContext | null {
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return null;
  return { canvasId: parsed.params.canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsCanvas(auth.userId, context.canvasId))) {
    sendForbidden(res);
    return;
  }
  const sessions = await listSessions(context.canvasId);
  sendSuccess(res, sessions);
}
