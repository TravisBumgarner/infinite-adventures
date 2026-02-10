import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { getTimelineDayCounts } from "../../services/timelineService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return;

  const start = req.query.start as string | undefined;
  const end = req.query.end as string | undefined;

  if (!start || !end || !ISO_DATE_RE.test(start) || !ISO_DATE_RE.test(end)) {
    sendBadRequest(res);
    return;
  }

  if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
    sendForbidden(res);
    return;
  }

  const counts = await getTimelineDayCounts(parsed.params.canvasId, start, end);
  sendSuccess(res, { counts });
}
