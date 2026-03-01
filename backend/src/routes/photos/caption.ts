import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { updatePhotoCaption } from "../../services/photoService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

const CaptionBody = z.object({ caption: z.string() });

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: IdParams, body: CaptionBody });
  if (!parsed) return;
  if (!(await userOwnsResource(auth.userId, "photo", parsed.params.id))) {
    sendForbidden(res);
    return;
  }
  const photo = await updatePhotoCaption(parsed.params.id, parsed.body.caption);
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
