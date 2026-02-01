import type { Request, Response } from "express";
import { deleteNote } from "../../services/noteService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface DeleteValidationContext {
  id: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): DeleteValidationContext | null {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return { id };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: DeleteValidationContext,
): Promise<void> {
  const deleted = deleteNote(context.id);
  if (!deleted) {
    sendNotFound(res, "NOTE_NOT_FOUND");
    return;
  }
  sendSuccess(res, { deleted: true });
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
