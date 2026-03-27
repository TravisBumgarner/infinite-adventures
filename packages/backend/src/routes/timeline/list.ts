import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { getTimeline } from "../../services/timelineService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

const ListTimelineQuery = z.object({
  sort: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(30),
  parentItemId: z.string().uuid().optional(),
});

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: CanvasIdParams, query: ListTimelineQuery });
  if (!parsed) return;

  if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
    sendForbidden(res);
    return;
  }

  const { sort, cursor, limit, parentItemId } = parsed.query;
  const result = await getTimeline(parsed.params.canvasId, sort, cursor, limit, parentItemId);
  sendSuccess(res, { entries: result.entries, nextCursor: result.nextCursor });
}
