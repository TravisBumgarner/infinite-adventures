import type { Request, Response } from "express";
import type { UpdateCanvasItemInput } from "shared";
import { updateItem } from "../../services/canvasItemService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export interface UpdateValidationContext {
  id: string;
  input: UpdateCanvasItemInput;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): UpdateValidationContext | null {
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return null;
  const { title, summary, canvas_x, canvas_y, session_date } = req.body;
  return { id: parsed.params.id, input: { title, summary, canvas_x, canvas_y, session_date } };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const item = await updateItem(context.id, context.input);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }
  sendSuccess(res, item);
}
