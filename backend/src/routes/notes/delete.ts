import type { Request, Response } from "express";
import { deleteNote } from "../../services/noteService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { NoteIdParams, parseRoute } from "../shared/validation.js";

export function validate(req: Request<{ noteId: string }>, res: Response): string | null {
  const parsed = parseRoute(req, res, { params: NoteIdParams });
  if (!parsed) return null;
  return parsed.params.noteId;
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
