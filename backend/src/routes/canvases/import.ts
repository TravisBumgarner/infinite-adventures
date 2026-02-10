import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { importCanvas } from "../../services/backupService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendInternalError, sendSuccess } from "../shared/responses.js";

export interface ImportValidationContext {
  userId: string;
}

export function validate(req: Request, res: Response): ImportValidationContext | null {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return null;
  return { userId: auth.userId };
}

export async function processRequest(
  req: Request,
  res: Response,
  context: ImportValidationContext,
): Promise<void> {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    sendBadRequest(res, "INVALID_BACKUP");
    return;
  }

  try {
    const result = await importCanvas(file.buffer, context.userId);
    sendSuccess(res, { id: result.id, name: result.name });
  } catch (err) {
    if (
      err instanceof Error &&
      /invalid backup file|newer version|invalid or unsupported|bad central directory/i.test(
        err.message,
      )
    ) {
      sendBadRequest(res, "INVALID_BACKUP");
      return;
    }
    sendInternalError(res);
  }
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
