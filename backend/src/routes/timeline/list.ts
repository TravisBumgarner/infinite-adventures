import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { getTimeline, type TimelineSort } from "../../services/timelineService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export interface ListTimelineValidationContext {
  canvasId: string;
  sort: TimelineSort;
}

const validSorts = new Set<string>(["created_at", "updated_at"]);

export function validate(req: Request, res: Response): ListTimelineValidationContext | null {
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return null;
  const sortParam = (req.query.sort as string) || "created_at";
  const sort: TimelineSort = validSorts.has(sortParam) ? (sortParam as TimelineSort) : "created_at";
  return { canvasId: parsed.params.canvasId, sort };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsCanvas(auth.userId, context.canvasId))) {
    sendForbidden(res);
    return;
  }
  const entries = await getTimeline(context.canvasId, context.sort);
  sendSuccess(res, entries);
}
