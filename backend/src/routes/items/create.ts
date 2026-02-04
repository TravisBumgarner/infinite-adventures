import type { Request, Response } from "express";
import type { CreateCanvasItemInput } from "shared";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";

export interface CreateValidationContext {
  input: CreateCanvasItemInput;
  canvasId: string;
}

export function validate(req: Request, res: Response): CreateValidationContext | null {
  const { type, title, notes, canvas_x, canvas_y } = req.body;
  const canvasId = req.params.canvasId ?? "";
  if (!title) {
    sendBadRequest(res);
    return null;
  }
  if (!type) {
    sendBadRequest(res);
    return null;
  }
  return { input: { type, title, notes, canvas_x, canvas_y }, canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  // Stub: return bad request
  sendBadRequest(res);
}
