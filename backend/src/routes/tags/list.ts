import type { Request, Response } from "express";
import { listTags } from "../../services/tagService.js";
import { sendSuccess } from "../shared/responses.js";

export async function handler(req: Request, res: Response): Promise<void> {
  const canvasIdParam = req.params.canvasId;
  const canvasId = typeof canvasIdParam === "string" ? canvasIdParam : "";
  const tags = await listTags(canvasId);
  sendSuccess(res, tags);
}
