import type { Request, Response } from "express";
import type { UpdateNoteInput } from "shared";
import { updateNote, ValidationError } from "../../services/noteService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface UpdateValidationContext {
  id: string;
  input: UpdateNoteInput;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): UpdateValidationContext | null {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  const { type, title, content, canvas_x, canvas_y } = req.body;
  return { id, input: { type, title, content, canvas_x, canvas_y } };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: UpdateValidationContext,
): Promise<void> {
  try {
    const note = await updateNote(context.id, context.input);
    if (!note) {
      sendNotFound(res, "NOTE_NOT_FOUND");
      return;
    }
    sendSuccess(res, note);
  } catch (err) {
    if (err instanceof ValidationError) {
      sendBadRequest(res);
      return;
    }
    throw err;
  }
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
