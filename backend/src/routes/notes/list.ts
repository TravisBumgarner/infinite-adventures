import type { Request, Response } from "express";
import { getItem } from "../../services/canvasItemService.js";
import { listNotes } from "../../services/noteService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export function validate(req: Request<{ itemId: string }>, res: Response): string | null {
  const { itemId } = req.params;
  if (!isValidUUID(itemId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return itemId;
}

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const itemId = validate(req, res);
  if (!itemId) return;

  // Verify item exists
  const item = await getItem(itemId);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  const notes = await listNotes(itemId);
  sendSuccess(res, notes);
}
