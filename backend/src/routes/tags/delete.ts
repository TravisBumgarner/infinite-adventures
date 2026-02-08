import type { Request, Response } from "express";
import { deleteTag } from "../../services/tagService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface DeleteTagValidationContext {
  id: string;
}

export function validate(
  req: Request<{ tagId: string }>,
  res: Response,
): DeleteTagValidationContext | null {
  const { tagId } = req.params;
  if (!isValidUUID(tagId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  return { id: tagId };
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
