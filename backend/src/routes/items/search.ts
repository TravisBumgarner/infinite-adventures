import type { Request, Response } from "express";
import { searchItems } from "../../services/canvasItemService.js";
import { sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export interface SearchValidationContext {
  query: string;
  canvasId: string;
}

export function validate(req: Request, res: Response): SearchValidationContext | null {
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return null;
  const query = typeof req.query.q === "string" ? req.query.q : "";
  return { query, canvasId: parsed.params.canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const results = await searchItems(context.query, context.canvasId);
  sendSuccess(res, { results });
}
