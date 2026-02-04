import type { Request, Response } from "express";
import { getItem } from "../../services/canvasItemService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface GetValidationContext {
  id: string;
}

export function validate(req: Request<{ id: string }>, res: Response): GetValidationContext | null {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return { id };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const item = await getItem(context.id);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }
  sendSuccess(res, item);
}
