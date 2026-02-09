import type { Request, Response } from "express";
import { deleteLink } from "../../services/canvasItemLinkService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { LinkParams, parseRoute } from "../shared/validation.js";

export async function handler(req: Request, res: Response): Promise<void> {
  const parsed = parseRoute(req, res, { params: LinkParams });
  if (!parsed) return;

  const deleted = await deleteLink(parsed.params.sourceItemId, parsed.params.targetItemId);
  if (!deleted) {
    sendNotFound(res);
    return;
  }

  sendSuccess(res, null, 204);
}
