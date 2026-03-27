import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { getItem, getItemContentId } from "../../services/canvasItemService.js";
import { confirmUpload, getPhotoUrl } from "../../services/photoService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { ItemIdParams, parseRoute } from "../shared/validation.js";

const ConfirmBody = z.object({
  key: z.string(),
  photoId: z.string().uuid(),
  originalName: z.string(),
  mimeType: z.string(),
});

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: ItemIdParams, body: ConfirmBody });
  if (!parsed) return;
  if (!(await userOwnsResource(auth.userId, "item", parsed.params.itemId))) {
    sendForbidden(res);
    return;
  }

  const item = await getItem(parsed.params.itemId);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  const contentId = await getItemContentId(parsed.params.itemId);
  if (!contentId) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  const photo = await confirmUpload({
    photoId: parsed.body.photoId,
    key: parsed.body.key,
    contentType: item.type,
    contentId,
    originalName: parsed.body.originalName,
    mimeType: parsed.body.mimeType,
  });

  const url = await getPhotoUrl(photo.filename);

  sendSuccess(
    res,
    {
      id: photo.id,
      url,
      originalName: photo.originalName,
      isMainPhoto: photo.isMainPhoto,
      isImportant: photo.isImportant,
      caption: photo.caption,
      aspectRatio: photo.aspectRatio ?? undefined,
      blurhash: photo.blurhash ?? undefined,
      cropX: photo.cropX ?? undefined,
      cropY: photo.cropY ?? undefined,
    },
    201,
  );
}
