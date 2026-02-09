import type { Request, Response } from "express";
import type { CreateCanvasItemInput } from "shared";
import { CreateCanvasItemInputSchema } from "shared";
import { createItem, ValidationError } from "../../services/canvasItemService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export interface CreateValidationContext {
  input: CreateCanvasItemInput;
  canvasId: string;
}

export function validate(req: Request, res: Response): CreateValidationContext | null {
  const parsed = parseRoute(req, res, {
    params: CanvasIdParams,
    body: CreateCanvasItemInputSchema,
  });
  if (!parsed) return null;
  return { input: parsed.body, canvasId: parsed.params.canvasId };
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
