import type { Request, Response } from "express";
import { deleteItem } from "../../services/canvasItemService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export interface DeleteValidationContext {
  id: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): DeleteValidationContext | null {
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return null;
  return { id: parsed.params.id };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const deleted = await deleteItem(context.id);
  if (!deleted) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }
  sendSuccess(res, { deleted: true });
}
