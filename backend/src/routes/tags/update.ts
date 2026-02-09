import type { Request, Response } from "express";
import type { UpdateTagInput } from "shared";
import { UpdateTagInputSchema } from "shared";
import { updateTag } from "../../services/tagService.js";
import { sendBadRequest, sendNotFound, sendSuccess } from "../shared/responses.js";
import { parseRoute, TagIdParams } from "../shared/validation.js";

export interface UpdateTagValidationContext {
  id: string;
  input: UpdateTagInput;
}

export function validate(
  req: Request<{ tagId: string }>,
  res: Response,
): UpdateTagValidationContext | null {
  const parsed = parseRoute(req, res, { params: TagIdParams, body: UpdateTagInputSchema });
  if (!parsed) return null;
  if (!parsed.body.name && !parsed.body.icon && !parsed.body.color) {
    sendBadRequest(res);
    return null;
  }
  return { id: parsed.params.tagId, input: parsed.body };
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
