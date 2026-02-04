import type { Request, Response } from "express";
import { sendNotFound } from "../shared/responses.js";

export async function handler(
  req: Request<{ filename: string }>,
  res: Response,
): Promise<void> {
  // Stub: return not found
  sendNotFound(res, "PHOTO_NOT_FOUND");
}
