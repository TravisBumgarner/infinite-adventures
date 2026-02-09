import type { Request, Response } from "express";
import { listTags } from "../../services/tagService.js";
import { sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export async function handler(req: Request, res: Response): Promise<void> {
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return;
  const tags = await listTags(parsed.params.canvasId);
  sendSuccess(res, tags);
}
