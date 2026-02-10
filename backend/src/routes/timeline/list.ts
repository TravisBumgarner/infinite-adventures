import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { getTimeline } from "../../services/timelineService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

const ListTimelineQuery = z.object({
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return;

  const queryResult = ListTimelineQuery.safeParse(req.query);
  if (!queryResult.success) {
    sendBadRequest(res);
    return;
  }

  const { sort, cursor, limit } = queryResult.data;
  if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
    sendForbidden(res);
    return;
  }
  const result = await getTimeline(parsed.params.canvasId, sort, cursor, limit);
  sendSuccess(res, { entries: result.entries, next_cursor: result.nextCursor });
}
