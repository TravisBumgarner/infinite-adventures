import type { Request, Response } from "express";
import type { UpdateNoteInput } from "shared";

export interface UpdateValidationContext {
  id: string;
  input: UpdateNoteInput;
}

export function validate(_req: Request<{ id: string }>, _res: Response): UpdateValidationContext | null {
  return null;
}

export async function processRequest(_req: Request, res: Response, _context: UpdateValidationContext): Promise<void> {
  res.status(500).json({ error: "not implemented" });
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
