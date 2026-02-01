import type { Request, Response } from "express";

export function validate(_req: Request, _res: Response): Record<string, never> | null {
  return {};
}

export async function processRequest(_req: Request, res: Response, _context: Record<string, never>): Promise<void> {
  res.status(500).json({ error: "not implemented" });
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
