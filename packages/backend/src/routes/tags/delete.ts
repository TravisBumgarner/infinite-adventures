import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsResource } from "../../services/authorizationService.js";
import { deleteTag } from "../../services/tagService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
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
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsResource(auth.userId, "tag", context.id))) {
    sendForbidden(res);
    return;
  }
  const deleted = await deleteTag(context.id);
  if (!deleted) {
    sendNotFound(res, "TAG_NOT_FOUND");
    return;
  }
  sendSuccess(res, { deleted: true });
}
