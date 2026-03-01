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
    // Item-level share — include all canvas items for mention resolution
    const item = await getItem(share.itemId);
    if (!item) {
      sendNotFound(res, "CANVAS_ITEM_NOT_FOUND");
      return;
    }
    const summaries = await listItems(share.canvasId);
    const fullItems = await Promise.all(summaries.map((s) => getItem(s.id)));
    const allItems = fullItems.filter((i) => i !== null);
    sendSuccess(res, {
      shareType: "item",
      canvasName: canvas.name,
      item,
      allItems,
    });
  } else {
    // Canvas-level share — return full items so viewers can see notes/photos
    const summaries = await listItems(share.canvasId);
    const fullItems = await Promise.all(summaries.map((s) => getItem(s.id)));
    const items = fullItems.filter((item) => item !== null);
    const canvasTags = await listTags(share.canvasId);
    sendSuccess(res, {
      shareType: "canvas",
      canvasName: canvas.name,
      items,
      tags: canvasTags,
    });
  }
}
