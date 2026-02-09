import type { Request, Response } from "express";
import { removeTagFromItem } from "../../services/tagService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { ItemTagParams, parseRoute } from "../shared/validation.js";

export interface RemoveTagValidationContext {
  itemId: string;
  tagId: string;
}

export function validate(
  req: Request<{ itemId: string; tagId: string }>,
  res: Response,
): RemoveTagValidationContext | null {
  const parsed = parseRoute(req, res, { params: ItemTagParams });
  if (!parsed) return null;
  return { itemId: parsed.params.itemId, tagId: parsed.params.tagId };
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
