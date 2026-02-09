import type { Request, Response } from "express";
import type { UpdateCanvasItemInput } from "shared";
import { UpdateCanvasItemInputSchema } from "shared";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { updateItem } from "../../services/canvasItemService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
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
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsResource(auth.userId, "item", context.id))) {
    sendForbidden(res);
    return;
  }
  const item = await updateItem(context.id, context.input);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }
  sendSuccess(res, item);
}
