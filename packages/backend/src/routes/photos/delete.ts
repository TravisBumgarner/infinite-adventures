import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { deletePhoto } from "../../services/photoService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export interface DeleteValidationContext {
  id: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): DeleteValidationContext | null {
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return null;
  return { id: parsed.params.id };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsResource(auth.userId, "photo", context.id))) {
    sendForbidden(res);
    return;
  }
  const deleted = await deletePhoto(context.id);
  if (!deleted) {
    sendNotFound(res, "PHOTO_NOT_FOUND");
    return;
  }
  sendSuccess(res, { deleted: true });
}
