import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { getGalleryEntries } from "../../services/galleryService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

const ListGalleryQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(30),
  importantOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: CanvasIdParams, query: ListGalleryQuery });
  if (!parsed) return;

  if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
    sendForbidden(res);
    return;
  }

  const { cursor, limit, importantOnly } = parsed.query;
  const result = await getGalleryEntries(parsed.params.canvasId, {
    cursor,
    limit,
    importantOnly,
  });
  sendSuccess(res, { entries: result.entries, nextCursor: result.nextCursor });
}
