import type { Request, Response } from "express";
import { getTaggedItems } from "../../services/canvasItemService.js";
import { sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export interface TaggedValidationContext {
  itemId: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): TaggedValidationContext | null {
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return null;
  return { itemId: parsed.params.id };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const items = await getTaggedItems(context.itemId);
  sendSuccess(res, items);
}
