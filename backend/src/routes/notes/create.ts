import type { Request, Response } from "express";
import type { CreateNoteInput } from "shared";
import { createNote, ValidationError } from "../../services/noteService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";

export interface CreateValidationContext {
  input: CreateNoteInput;
  canvasId: string;
}

export function validate(req: Request, res: Response): CreateValidationContext | null {
  const { type, title, content, canvas_x, canvas_y } = req.body;
  const canvasId = req.params.canvasId ?? "";
  if (!title) {
    sendBadRequest(res);
    return null;
  }
  if (!type) {
    sendBadRequest(res);
    return null;
  }
  return { input: { type, title, content, canvas_x, canvas_y }, canvasId };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: CreateValidationContext,
): Promise<void> {
  try {
    const note = await createNote(context.input, context.canvasId);
    sendSuccess(res, note, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      sendBadRequest(res);
      return;
    }
    throw err;
  }
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
