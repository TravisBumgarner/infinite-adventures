import type { Request, Response } from "express";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface GetValidationContext {
  id: string;
}

export function validate(req: Request<{ id: string }>, res: Response): GetValidationContext | null {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return { id };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  // Stub: return not found
  sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
}
