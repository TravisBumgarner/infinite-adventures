import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { listHistory } from "../../services/contentHistoryService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { NoteIdParams, parseRoute } from "../shared/validation.js";

export async function handler(req: Request<{ noteId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: NoteIdParams });
  if (!parsed) return;
  const { noteId } = parsed.params;
  if (!(await userOwnsResource(auth.userId, "note", noteId))) {
    sendForbidden(res);
    return;
  }

  const history = await listHistory(noteId);
  sendSuccess(res, history);
}
