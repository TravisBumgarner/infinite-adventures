import type { Request, Response } from "express";
import { removeTagFromItem } from "../../services/tagService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface RemoveTagValidationContext {
  itemId: string;
  tagId: string;
}

export function validate(
  req: Request<{ itemId: string; tagId: string }>,
  res: Response,
): RemoveTagValidationContext | null {
  const { itemId, tagId } = req.params;
  if (!isValidUUID(itemId) || !isValidUUID(tagId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return { itemId, tagId };
}

export async function handler(
  req: Request<{ itemId: string; tagId: string }>,
  res: Response,
): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const removed = await removeTagFromItem(context.itemId, context.tagId);
  if (!removed) {
    sendNotFound(res, "TAG_NOT_FOUND");
    return;
  }
  sendSuccess(res, { removed: true });
}
