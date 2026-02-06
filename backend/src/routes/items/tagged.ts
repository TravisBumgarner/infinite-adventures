import type { Request, Response } from "express";
import { getTaggedItems } from "../../services/canvasItemService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface TaggedValidationContext {
  itemId: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): TaggedValidationContext | null {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return { itemId: id };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const items = await getTaggedItems(context.itemId);
  sendSuccess(res, items);
}
