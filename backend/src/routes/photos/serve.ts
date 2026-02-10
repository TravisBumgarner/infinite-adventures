import * as fs from "node:fs";
import type { Request, Response } from "express";
import { getPhoto, getPhotoPath } from "../../services/photoService.js";
import { sendNotFound } from "../shared/responses.js";

export async function handler(req: Request<{ filename: string }>, res: Response): Promise<void> {
  const { filename } = req.params;

  // Extract the photo ID from filename (UUID without extension)
  const idMatch = filename.match(/^([0-9a-f-]+)/i);
  if (!idMatch) {
    sendNotFound(res, "PHOTO_NOT_FOUND");
    return;
  }

  const photoId = idMatch[1];
  const photo = await getPhoto(photoId!);
  if (!photo) {
    sendNotFound(res, "PHOTO_NOT_FOUND");
    return;
  }

  const filePath = getPhotoPath(photo.filename);
  if (!fs.existsSync(filePath)) {
    sendNotFound(res, "PHOTO_NOT_FOUND");
    return;
  }

  res.setHeader("Content-Type", photo.mimeType);
  res.sendFile(filePath);
}
