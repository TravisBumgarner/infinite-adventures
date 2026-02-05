import type { Request, Response } from "express";
import { listItems } from "../../services/canvasItemService.js";
import { sendSuccess } from "../shared/responses.js";

export interface ListValidationContext {
  canvasId: string;
}

export function validate(req: Request, _res: Response): ListValidationContext | null {
  const canvasId = req.params.canvasId ?? "";
  return { canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const items = await listItems(context.canvasId);
  sendSuccess(res, items);
}
