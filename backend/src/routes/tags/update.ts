import type { Request, Response } from "express";
import type { UpdateTagInput } from "shared";
import { updateTag } from "../../services/tagService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { isValidUUID } from "../shared/validation.js";

export interface UpdateTagValidationContext {
  id: string;
  input: UpdateTagInput;
}

export function validate(
  req: Request<{ tagId: string }>,
  res: Response,
): UpdateTagValidationContext | null {
  const { tagId } = req.params;
  if (!isValidUUID(tagId)) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }
  const { name, icon, color } = req.body;
  if (!name && !icon && !color) {
    sendBadRequest(res);
    return null;
  }
  return { id: tagId, input: { name, icon, color } };
}

export async function handler(req: Request<{ tagId: string }>, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const tag = await updateTag(context.id, context.input);
  if (!tag) {
    sendNotFound(res, "TAG_NOT_FOUND");
    return;
  }
  sendSuccess(res, tag);
}
