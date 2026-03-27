import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { presignUpload } from "../../services/photoService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { ItemIdParams, parseRoute } from "../shared/validation.js";

const PresignBody = z.object({
  contentType: z.string(),
  filename: z.string(),
});

export async function handler(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: ItemIdParams, body: PresignBody });
  if (!parsed) return;
  if (!(await userOwnsResource(auth.userId, "item", parsed.params.itemId))) {
    sendForbidden(res);
    return;
  }

  const result = await presignUpload(parsed.body.filename, parsed.body.contentType);
  sendSuccess(res, result);
}
