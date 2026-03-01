import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { selectPhoto } from "../../services/photoService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

const SelectBody = z
  .object({
    cropX: z.number().optional(),
    cropY: z.number().optional(),
  })
  .optional();

export interface SelectValidationContext {
  id: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): SelectValidationContext | null {
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return null;
  return { id: parsed.params.id };
}

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: IdParams, body: SelectBody });
  if (!parsed) return;
  if (!(await userOwnsResource(auth.userId, "photo", parsed.params.id))) {
    sendForbidden(res);
    return;
  }
  const photo = await selectPhoto(parsed.params.id, parsed.body?.cropX, parsed.body?.cropY);
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
