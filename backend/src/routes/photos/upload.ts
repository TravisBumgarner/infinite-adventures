import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { getItem, getItemContentId } from "../../services/canvasItemService.js";
import { uploadPhoto } from "../../services/photoService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { ItemIdParams, parseRoute } from "../shared/validation.js";

export interface UploadValidationContext {
  itemId: string;
}

export function validate(
  req: Request<{ itemId: string }>,
  res: Response,
): UploadValidationContext | null {
  const parsed = parseRoute(req, res, { params: ItemIdParams });
  if (!parsed) return null;
  return { itemId: parsed.params.itemId };
}

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsResource(auth.userId, "item", context.itemId))) {
    sendForbidden(res);
    return;
  }

  // Get the item to find its content_id and type
  const item = await getItem(context.itemId);
  if (!item) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  // Check if file was uploaded (multer adds req.file)
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    sendBadRequest(res);
    return;
  }

  // Get content_id for photo association
  const contentId = await getItemContentId(context.itemId);
  if (!contentId) {
    sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
    return;
  }

  const photo = await uploadPhoto({
    content_type: item.type,
    content_id: contentId,
    original_name: file.originalname,
    mime_type: file.mimetype,
    buffer: file.buffer,
  });

  sendSuccess(
    res,
    {
      id: photo.id,
      url: `/api/photos/${photo.filename}`,
      original_name: photo.original_name,
      is_selected: photo.is_selected,
      aspect_ratio: photo.aspect_ratio ?? undefined,
      blurhash: photo.blurhash ?? undefined,
    },
    201,
  );
}
