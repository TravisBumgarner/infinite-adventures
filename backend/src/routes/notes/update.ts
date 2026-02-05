import type { Request, Response } from "express";
import type { UpdateNoteInput } from "shared";
import { updateNote } from "../../services/noteService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface UpdateValidationContext {
  noteId: string;
  input: UpdateNoteInput;
}

export function validate(
  req: Request<{ noteId: string }>,
  res: Response,
): UpdateValidationContext | null {
  const { noteId } = req.params;
  if (!isValidUUID(noteId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  const { content } = req.body;
  if (content === undefined) {
    sendBadRequest(res, "INVALID_INPUT");
    return null;
  }
  return { noteId, input: { content } };
}

export async function handler(req: Request<{ noteId: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;

  const note = await updateNote(context.noteId, context.input);
  if (!note) {
    sendNotFound(res, "NOTE_NOT_FOUND");
    return;
  }

  sendSuccess(res, note);
}
