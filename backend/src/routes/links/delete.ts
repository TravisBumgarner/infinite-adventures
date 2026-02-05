import type { Request, Response } from "express";
import { deleteLink } from "../../services/canvasItemLinkService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";

export async function handler(req: Request, res: Response): Promise<void> {
  const sourceItemId = req.params.sourceItemId as string | undefined;
  const targetItemId = req.params.targetItemId as string | undefined;

  if (!sourceItemId || !targetItemId) {
    sendNotFound(res);
    return;
  }

  const deleted = await deleteLink(sourceItemId, targetItemId);
  if (!deleted) {
    sendNotFound(res);
    return;
  }

  sendSuccess(res, null, 204);
}
