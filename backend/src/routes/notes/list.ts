import type { Request, Response } from "express";
import { listNotes } from "../../services/noteService.js";
import { sendSuccess } from "../shared/responses.js";

export interface ListValidationContext {
  canvasId: string;
}

export function validate(req: Request, _res: Response): ListValidationContext | null {
  const canvasId = req.params.canvasId ?? "";
  return { canvasId };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: ListValidationContext,
): Promise<void> {
  const notes = await listNotes(context.canvasId);
  sendSuccess(res, notes);
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
