import type { Request, Response } from "express";
import type { UpdateCanvasItemInput } from "shared";
import { updateItem } from "../../services/canvasItemService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface UpdateValidationContext {
  id: string;
  input: UpdateCanvasItemInput;
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
  const { title, summary, canvas_x, canvas_y, session_date } = req.body;
  return { id, input: { title, summary, canvas_x, canvas_y, session_date } };
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
