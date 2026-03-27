import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { exportCanvas, importCanvas } from "../../services/backupService.js";
import { getCanvasById } from "../../services/canvasService.js";
import { getShareByToken } from "../../services/shareService.js";
import { requireUserId } from "../shared/auth.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { parseRoute } from "../shared/validation.js";

const TokenParams = z.object({ token: z.string().uuid() });

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;

  const parsed = parseRoute(req, res, { params: TokenParams });
  if (!parsed) return;

  const share = await getShareByToken(parsed.params.token);
  if (!share) {
    sendNotFound(res, "SHARE_NOT_FOUND");
    return;
  }

  const canvas = await getCanvasById(share.canvasId);
  if (!canvas) {
    sendNotFound(res, "CANVAS_NOT_FOUND");
    return;
  }

  // Export the shared canvas as a zip buffer and re-import for the requesting user
  const zipBuffer = await exportCanvas(share.canvasId);
  const result = await importCanvas(zipBuffer, auth.userId);

  sendSuccess(res, { id: result.id, name: result.name }, 201);
}
