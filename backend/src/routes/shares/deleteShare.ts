import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { deleteShare, getShareById } from "../../services/shareService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { IdParams, parseRoute } from "../shared/validation.js";

export async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: IdParams });
  if (!parsed) return;
  const share = await getShareById(parsed.params.id);
  if (!share) {
    sendNotFound(res, "SHARE_NOT_FOUND");
    return;
  }
  if (!(await userOwnsCanvas(auth.userId, share.canvasId))) {
    sendForbidden(res);
    return;
  }
  await deleteShare(share.id);
  sendSuccess(res, { deleted: true });
}
