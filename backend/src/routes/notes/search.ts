import type { Request, Response } from "express";
import { searchNotes } from "../../services/noteService.js";
import { sendSuccess } from "../shared/responses.js";

export interface SearchValidationContext {
  query: string;
}

export function validate(req: Request, _res: Response): SearchValidationContext | null {
  const query = (req.query.q as string) ?? "";
  return { query };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: SearchValidationContext,
): Promise<void> {
  const results = searchNotes(context.query);
  sendSuccess(res, { results });
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
