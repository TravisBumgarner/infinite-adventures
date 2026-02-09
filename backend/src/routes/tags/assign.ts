import type { Request, Response } from "express";
import { addTagToItem } from "../../services/tagService.js";
import { sendSuccess } from "../shared/responses.js";
import { ItemTagParams, parseRoute } from "../shared/validation.js";

export interface AssignTagValidationContext {
  itemId: string;
  tagId: string;
}

export function validate(
  req: Request<{ itemId: string; tagId: string }>,
  res: Response,
): AssignTagValidationContext | null {
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
  await addTagToItem(context.itemId, context.tagId);
  sendSuccess(res, { assigned: true }, 201);
}
