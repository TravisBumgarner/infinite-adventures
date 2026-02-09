import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { createLink } from "../../services/canvasItemLinkService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendForbidden, sendSuccess } from "../shared/responses.js";
import { LinkParams } from "../shared/validation.js";

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const bodyResult = LinkParams.safeParse(req.body);
  if (!bodyResult.success) {
    sendBadRequest(res);
    return;
  }
  if (!(await userOwnsResource(auth.userId, "item", bodyResult.data.sourceItemId))) {
    sendForbidden(res);
    return;
  }

  const created = await createLink(bodyResult.data.sourceItemId, bodyResult.data.targetItemId);
  sendSuccess(res, { created }, created ? 201 : 200);
}
