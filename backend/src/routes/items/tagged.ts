import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { getTaggedItems } from "../../services/canvasItemService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
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
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsResource(auth.userId, "item", context.itemId))) {
    sendForbidden(res);
    return;
  }
  const items = await getTaggedItems(context.itemId);
  sendSuccess(res, items);
}
