import type { Request, Response } from "express";
import { listItems } from "../../services/canvasItemService.js";
import { sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export interface ListValidationContext {
  canvasId: string;
}

export function validate(req: Request, res: Response): ListValidationContext | null {
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return null;
  return { canvasId: parsed.params.canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const items = await listItems(context.canvasId);
  sendSuccess(res, items);
}
