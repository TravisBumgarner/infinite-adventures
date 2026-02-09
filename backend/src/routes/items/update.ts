import type { Request, Response } from "express";
import type { UpdateCanvasItemInput } from "shared";
import { UpdateCanvasItemInputSchema } from "shared";
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
  const parsed = parseRoute(req, res, { params: IdParams, body: UpdateCanvasItemInputSchema });
  if (!parsed) return null;
  return { id: parsed.params.id, input: parsed.body };
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
