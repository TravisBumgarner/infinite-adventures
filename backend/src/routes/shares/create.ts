import type { Request, Response } from "express";
import { CreateShareInputSchema } from "shared";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { createShare } from "../../services/shareService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { parseRoute } from "../shared/validation.js";

const EmptyParams = z.object({});

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: EmptyParams, body: CreateShareInputSchema });
  if (!parsed) return;
  const { canvasId, itemId } = parsed.body;
  if (!(await userOwnsCanvas(auth.userId, canvasId))) {
    sendForbidden(res);
    return;
  }
  const share = await createShare(canvasId, itemId ?? null, auth.userId);
  sendSuccess(res, share, 201);
}
