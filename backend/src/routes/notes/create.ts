import type { Request, Response } from "express";
import type { CreateNoteInput } from "shared";
import { getItem } from "../../services/canvasItemService.js";
import { createNote } from "../../services/noteService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface CreateValidationContext {
  itemId: string;
  input: CreateNoteInput;
}

export function validate(
  req: Request<{ itemId: string }>,
  res: Response,
): CreateValidationContext | null {
  const { itemId } = req.params;
  if (!isValidUUID(itemId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  const { content } = req.body;
  return { itemId, input: { content } };
}

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;

  // Verify item exists
  const item = await getItem(context.itemId);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  const note = await createNote(context.itemId, context.input);
  sendSuccess(res, note, 201);
}
