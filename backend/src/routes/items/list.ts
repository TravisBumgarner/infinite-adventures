import type { Request, Response } from "express";
import { sendSuccess } from "../shared/responses.js";

export interface ListValidationContext {
  canvasId: string;
}

export function validate(req: Request, res: Response): ListValidationContext | null {
  const canvasId = req.params.canvasId ?? "";
  return { canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  // Stub: return empty array
  sendSuccess(res, []);
}
