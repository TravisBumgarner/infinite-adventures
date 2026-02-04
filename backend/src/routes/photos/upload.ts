import type { Request, Response } from "express";
import { getItem } from "../../services/canvasItemService.js";
import { uploadPhoto } from "../../services/photoService.js";
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

  const photo = await uploadPhoto({
    content_type: item.type,
    content_id: item.content.id,
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
    },
    201,
  );
}
