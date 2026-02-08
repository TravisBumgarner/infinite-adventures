import type { Request, Response } from "express";
import { addTagToItem } from "../../services/tagService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface AssignTagValidationContext {
  itemId: string;
  tagId: string;
}

export function validate(
  req: Request<{ itemId: string; tagId: string }>,
  res: Response,
): AssignTagValidationContext | null {
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
  await addTagToItem(context.itemId, context.tagId);
  sendSuccess(res, { assigned: true }, 201);
}
