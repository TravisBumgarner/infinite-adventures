import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requireUserId } from "../shared/auth.js";

export interface ImportValidationContext {
  userId: string;
}

export function validate(req: Request, res: Response): ImportValidationContext | null {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return null;
  return { userId: auth.userId };
}

export async function processRequest(
  _req: Request,
  _res: Response,
  _context: ImportValidationContext,
): Promise<void> {
  throw new Error("Not implemented");
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
