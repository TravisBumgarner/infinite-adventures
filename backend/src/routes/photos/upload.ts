import type { Request, Response } from "express";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface UploadValidationContext {
  itemId: string;
}

export function validate(
  req: Request<{ itemId: string }>,
  res: Response,
): UploadValidationContext | null {
  const { itemId } = req.params;
  if (!isValidUUID(itemId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return { itemId };
}

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  // Stub: return not found
  sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
}
