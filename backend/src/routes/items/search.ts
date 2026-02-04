import type { Request, Response } from "express";
import { sendSuccess } from "../shared/responses.js";

export interface SearchValidationContext {
  query: string;
  canvasId: string;
}

export function validate(req: Request, res: Response): SearchValidationContext | null {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const canvasId = req.params.canvasId ?? "";
  return { query, canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  // Stub: return empty results
  sendSuccess(res, { results: [] });
}
