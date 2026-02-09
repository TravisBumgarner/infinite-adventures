import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { getCanvas } from "../../services/canvasService.js";
import { requireUserId } from "../shared/auth.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export interface GetValidationContext {
  id: string;
  userId: string;
}

export function validate(req: Request<{ id: string }>, res: Response): GetValidationContext | null {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return null;
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return null;
  return { id: parsed.params.id, userId: auth.userId };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: GetValidationContext,
): Promise<void> {
  const canvas = await getCanvas(context.id, context.userId);
  if (!canvas) {
    sendNotFound(res, "CANVAS_NOT_FOUND");
    return;
  }
  sendSuccess(res, canvas);
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
