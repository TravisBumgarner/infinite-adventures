import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { listCanvases } from "../../services/canvasService.js";
import { requireUserId } from "../shared/auth.js";
import { sendSuccess } from "../shared/responses.js";

export interface ListValidationContext {
  userId: string;
}

export function validate(req: AuthenticatedRequest, res: Response): ListValidationContext | null {
  const auth = requireUserId(req, res);
  if (!auth) return null;
  return { userId: auth.userId };
}

export async function processRequest(
  _req: AuthenticatedRequest,
  res: Response,
  context: ListValidationContext,
): Promise<void> {
  const canvases = await listCanvases(context.userId);
  sendSuccess(res, canvases);
}

export async function handler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
