import type { Request, Response } from "express";
import { selectPhoto } from "../../services/photoService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface SelectValidationContext {
  id: string;
}

export function validate(
  req: Request<{ id: string }>,
  res: Response,
): SelectValidationContext | null {
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
  const photo = await selectPhoto(context.id);
  if (!photo) {
    sendNotFound(res, "PHOTO_NOT_FOUND");
    return;
  }
  sendSuccess(res, {
    id: photo.id,
    url: `/api/photos/${photo.filename}`,
    original_name: photo.original_name,
    is_selected: photo.is_selected,
  });
}
