import type { Request, Response } from "express";
import { updateCanvas } from "../../services/canvasService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface UpdateValidationContext {
  id: string;
  name: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): UpdateValidationContext | null {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    sendBadRequest(res);
    return null;
  }
  return { id, name: name.trim() };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: UpdateValidationContext,
): Promise<void> {
  const canvas = await updateCanvas(context.id, context.name);
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
