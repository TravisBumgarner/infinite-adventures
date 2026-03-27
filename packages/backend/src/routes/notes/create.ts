import type { Request, Response } from "express";
import type { CreateNoteInput } from "shared";
import { CreateNoteInputSchema } from "shared";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { getItem } from "../../services/canvasItemService.js";
import { createNote } from "../../services/noteService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { ItemIdParams, parseRoute } from "../shared/validation.js";

export interface CreateValidationContext {
  itemId: string;
  input: CreateNoteInput;
}

export function validate(
  req: Request<{ itemId: string }>,
  res: Response,
): CreateValidationContext | null {
  const parsed = parseRoute(req, res, { params: ItemIdParams, body: CreateNoteInputSchema });
  if (!parsed) return null;
  return { itemId: parsed.params.itemId, input: parsed.body };
}

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsResource(auth.userId, "item", context.itemId))) {
    sendForbidden(res);
    return;
  }

  // Verify item exists
  const item = await getItem(context.itemId);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  const note = await createNote(context.itemId, context.input);
  sendSuccess(res, note, 201);
}
