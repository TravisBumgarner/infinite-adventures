import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { getTimelineDayCounts } from "../../services/timelineService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

const CountsQuery = z.object({
  start: z.string().date(),
  end: z.string().date(),
});

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return;

  const queryResult = CountsQuery.safeParse(req.query);
  if (!queryResult.success) {
    sendBadRequest(res);
    return;
  }

  if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
    sendForbidden(res);
    return;
  }

  const { start, end } = queryResult.data;
  const counts = await getTimelineDayCounts(parsed.params.canvasId, start, end);
  sendSuccess(res, { counts });
}
