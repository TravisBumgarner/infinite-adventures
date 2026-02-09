import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { getItem } from "../../services/canvasItemService.js";
import { listNotes } from "../../services/noteService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { ItemIdParams, parseRoute } from "../shared/validation.js";

export function validate(req: Request<{ itemId: string }>, res: Response): string | null {
  const parsed = parseRoute(req, res, { params: ItemIdParams });
  if (!parsed) return null;
  return parsed.params.itemId;
}

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const itemId = validate(req, res);
  if (!itemId) return;
  if (!(await userOwnsResource(auth.userId, "item", itemId))) {
    sendForbidden(res);
    return;
  }

  // Verify item exists
  const item = await getItem(itemId);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  const notes = await listNotes(itemId);
  sendSuccess(res, notes);
}
