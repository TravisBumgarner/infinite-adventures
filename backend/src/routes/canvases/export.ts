import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { exportCanvas } from "../../services/backupService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendInternalError, sendNotFound } from "../shared/responses.js";
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
  res: Response,
  context: ExportValidationContext,
): Promise<void> {
  const owns = await userOwnsCanvas(context.userId, context.canvasId);
  if (!owns) {
    sendForbidden(res);
    return;
  }

  try {
    const zipBuffer = await exportCanvas(context.canvasId);
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename="canvas-export.zip"`);
    res.send(zipBuffer);
  } catch (err) {
    if (err instanceof Error && err.message === "Canvas not found") {
      sendNotFound(res, "CANVAS_NOT_FOUND");
      return;
    }
    sendInternalError(res);
  }
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
