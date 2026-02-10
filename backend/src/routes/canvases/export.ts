import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requireUserId } from "../shared/auth.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export interface ExportValidationContext {
  canvasId: string;
  userId: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): ExportValidationContext | null {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return null;
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return null;
  return { canvasId: parsed.params.id, userId: auth.userId };
}

export async function processRequest(
  _req: Request,
  _res: Response,
  _context: ExportValidationContext,
): Promise<void> {
  throw new Error("Not implemented");
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
