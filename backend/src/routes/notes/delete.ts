import type { Request, Response } from "express";
import { deleteNote } from "../../services/noteService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export function validate(req: Request<{ noteId: string }>, res: Response): string | null {
  const { noteId } = req.params;
  if (!isValidUUID(noteId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return noteId;
}

export async function handler(req: Request<{ noteId: string }>, res: Response): Promise<void> {
  const noteId = validate(req, res);
  if (!noteId) return;

  const deleted = await deleteNote(noteId);
  if (!deleted) {
    sendNotFound(res, "NOTE_NOT_FOUND");
    return;
  }

  sendSuccess(res, { deleted: true });
}
