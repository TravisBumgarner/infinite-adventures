import type { Request, Response } from "express";
import { searchItems } from "../../services/canvasItemService.js";
import { sendSuccess } from "../shared/responses.js";

export interface SearchValidationContext {
  query: string;
  canvasId: string;
}

export function validate(req: Request, _res: Response): SearchValidationContext | null {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const canvasIdParam = req.params.canvasId;
  const canvasId = typeof canvasIdParam === "string" ? canvasIdParam : "";
  return { query, canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const results = await searchItems(context.query, context.canvasId);
  sendSuccess(res, { results });
}
