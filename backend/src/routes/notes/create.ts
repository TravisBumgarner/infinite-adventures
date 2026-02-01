import type { Request, Response } from "express";
import type { CreateNoteInput } from "shared";

export interface CreateValidationContext {
  input: CreateNoteInput;
}

export function validate(_req: Request, _res: Response): CreateValidationContext | null {
  return null;
}

export async function processRequest(_req: Request, res: Response, _context: CreateValidationContext): Promise<void> {
  res.status(500).json({ error: "not implemented" });
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
