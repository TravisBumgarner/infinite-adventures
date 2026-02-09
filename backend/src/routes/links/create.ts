import type { Request, Response } from "express";
import { createLink } from "../../services/canvasItemLinkService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";
import { LinkParams } from "../shared/validation.js";

export async function handler(req: Request, res: Response): Promise<void> {
  const bodyResult = LinkParams.safeParse(req.body);
  if (!bodyResult.success) {
    sendBadRequest(res);
    return;
  }

  const created = await createLink(bodyResult.data.sourceItemId, bodyResult.data.targetItemId);
  sendSuccess(res, { created }, created ? 201 : 200);
}
