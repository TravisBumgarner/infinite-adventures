import type { Request, Response } from "express";
import type { UpdateNoteInput } from "shared";
import { UpdateNoteInputSchema } from "shared";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { updateNote } from "../../services/noteService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { NoteIdParams, parseRoute } from "../shared/validation.js";

export interface UpdateValidationContext {
  noteId: string;
  input: UpdateNoteInput;
}

export function validate(
  req: Request<{ noteId: string }>,
  res: Response,
): UpdateValidationContext | null {
  const parsed = parseRoute(req, res, { params: NoteIdParams, body: UpdateNoteInputSchema });
  if (!parsed) return null;
  if (parsed.body.content === undefined && parsed.body.isImportant === undefined) {
    sendBadRequest(res, "INVALID_INPUT");
    return null;
  }
  return { noteId: parsed.params.noteId, input: parsed.body };
}

export async function handler(req: Request<{ noteId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsResource(auth.userId, "note", context.noteId))) {
    sendForbidden(res);
    return;
  }

  const note = await updateNote(context.noteId, context.input);
  if (!note) {
    sendNotFound(res, "NOTE_NOT_FOUND");
    return;
  }

  sendSuccess(res, note);
}
