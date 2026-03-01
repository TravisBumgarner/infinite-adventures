import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { listSharesByCanvas } from "../../services/shareService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { parseRoute } from "../shared/validation.js";

const EmptyParams = z.object({});
const ListSharesQuery = z.object({ canvasId: z.string().uuid() });

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: EmptyParams, query: ListSharesQuery });
  if (!parsed) return;
  const { canvasId } = parsed.query;
  if (!(await userOwnsCanvas(auth.userId, canvasId))) {
    sendForbidden(res);
    return;
  }
  const shares = await listSharesByCanvas(canvasId);
  sendSuccess(res, shares);
}
