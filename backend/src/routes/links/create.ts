import type { Request, Response } from "express";
import { createLink } from "../../services/canvasItemLinkService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";

export async function handler(req: Request, res: Response): Promise<void> {
  const { sourceItemId, targetItemId } = req.body;

  if (!sourceItemId || !targetItemId) {
    sendBadRequest(res);
    return;
  }

  const created = await createLink(sourceItemId, targetItemId);
  sendSuccess(res, { created }, created ? 201 : 200);
}
