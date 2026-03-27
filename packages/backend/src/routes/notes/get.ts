import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { getNote } from "../../services/noteService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { NoteIdParams, parseRoute } from "../shared/validation.js";

export function validate(req: Request<{ noteId: string }>, res: Response): string | null {
  const parsed = parseRoute(req, res, { params: NoteIdParams });
  if (!parsed) return null;
  return parsed.params.noteId;
}

export async function handler(req: Request<{ noteId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const noteId = validate(req, res);
  if (!noteId) return;
  if (!(await userOwnsResource(auth.userId, "note", noteId))) {
    sendForbidden(res);
    return;
  }

  const note = await getNote(noteId);
  if (!note) {
    sendNotFound(res, "NOTE_NOT_FOUND");
    return;
  }

  sendSuccess(res, note);
}
