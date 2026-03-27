import type { Request, Response } from "express";
import type { CreateTagInput } from "shared";
import { CreateTagInputSchema } from "shared";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import { createTag } from "../../services/tagService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

export interface CreateTagValidationContext {
  input: CreateTagInput;
  canvasId: string;
}

export function validate(req: Request, res: Response): CreateTagValidationContext | null {
  const parsed = parseRoute(req, res, { params: CanvasIdParams, body: CreateTagInputSchema });
  if (!parsed) return null;
  return { input: parsed.body, canvasId: parsed.params.canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const context = validate(req, res);
  if (!context) return;
  if (!(await userOwnsCanvas(auth.userId, context.canvasId))) {
    sendForbidden(res);
    return;
  }
  const tag = await createTag(context.input, context.canvasId);
  sendSuccess(res, tag, 201);
}
