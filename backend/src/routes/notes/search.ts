import type { Request, Response } from "express";

export interface SearchValidationContext {
  query: string;
}

export function validate(_req: Request, _res: Response): SearchValidationContext | null {
  return null;
}

export async function processRequest(_req: Request, res: Response, _context: SearchValidationContext): Promise<void> {
  res.status(500).json({ error: "not implemented" });
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
