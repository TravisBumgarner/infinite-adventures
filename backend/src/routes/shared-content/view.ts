import type { Request, Response } from "express";
import { z } from "zod";
import { getItem, listItems } from "../../services/canvasItemService.js";
import { getCanvasById } from "../../services/canvasService.js";
import { getShareByToken } from "../../services/shareService.js";
import { listTags } from "../../services/tagService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { parseRoute } from "../shared/validation.js";

const TokenParams = z.object({ token: z.string().uuid() });

export async function handler(req: Request, res: Response): Promise<void> {
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

  if (share.itemId) {
    // Item-level share
    const item = await getItem(share.itemId);
    if (!item) {
      sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
      return;
    }
    sendSuccess(res, {
      shareType: "item",
      canvasName: canvas.name,
      item,
    });
  } else {
    // Canvas-level share
    const items = await listItems(share.canvasId);
    const canvasTags = await listTags(share.canvasId);
    sendSuccess(res, {
      shareType: "canvas",
      canvasName: canvas.name,
      items,
      tags: canvasTags,
    });
  }
}
