import type { Request, Response } from "express";
import { listNotes } from "../../services/noteService.js";
import { sendSuccess } from "../shared/responses.js";

export function validate(_req: Request, _res: Response): Record<string, never> | null {
  return {};
}

export async function processRequest(
  _req: Request,
  res: Response,
  _context: Record<string, never>,
): Promise<void> {
  const notes = listNotes();
  sendSuccess(res, notes);
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
