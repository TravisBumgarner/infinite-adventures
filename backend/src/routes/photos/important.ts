import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { togglePhotoImportant } from "../../services/photoService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export function validate(req: Request<{ id: string }>, res: Response) {
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
  const photo = await togglePhotoImportant(context.id);
  if (!photo) {
    sendNotFound(res, "PHOTO_NOT_FOUND");
    return;
  }
  sendSuccess(res, {
    id: photo.id,
    url: `/api/photos/${photo.filename}`,
    originalName: photo.originalName,
    isMainPhoto: photo.isMainPhoto,
    isImportant: photo.isImportant,
    caption: photo.caption,
    aspectRatio: photo.aspectRatio ?? undefined,
    blurhash: photo.blurhash ?? undefined,
    cropX: photo.cropX ?? undefined,
    cropY: photo.cropY ?? undefined,
  });
}
