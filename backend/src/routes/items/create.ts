import type { Request, Response } from "express";
import type { CreateCanvasItemInput } from "shared";
import { createItem, ValidationError } from "../../services/canvasItemService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export interface CreateValidationContext {
  input: CreateCanvasItemInput;
  canvasId: string;
}

export function validate(req: Request, res: Response): CreateValidationContext | null {
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return null;
  const { type, title, canvas_x, canvas_y } = req.body;
  if (!title) {
    sendBadRequest(res);
    return null;
  }
  if (!type) {
    sendBadRequest(res);
    return null;
  }
  return { input: { type, title, canvas_x, canvas_y }, canvasId: parsed.params.canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  try {
    const item = await createItem(context.input, context.canvasId);
    sendSuccess(res, item, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      sendBadRequest(res);
      return;
    }
    throw err;
  }
}
