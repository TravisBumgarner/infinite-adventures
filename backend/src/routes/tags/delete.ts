import type { Request, Response } from "express";
import { deleteTag } from "../../services/tagService.js";
import { sendNotFound, sendSuccess } from "../shared/responses.js";
import { parseRoute, TagIdParams } from "../shared/validation.js";

export interface DeleteTagValidationContext {
  id: string;
}

export function validate(
  req: Request<{ tagId: string }>,
  res: Response,
): DeleteTagValidationContext | null {
  const parsed = parseRoute(req, res, { params: TagIdParams });
  if (!parsed) return null;
  return { id: parsed.params.tagId };
}

export async function handler(req: Request<{ tagId: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const deleted = await deleteTag(context.id);
  if (!deleted) {
    sendNotFound(res, "TAG_NOT_FOUND");
    return;
  }
  sendSuccess(res, { deleted: true });
}
