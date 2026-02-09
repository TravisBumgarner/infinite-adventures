import type { Request, Response } from "express";
import type { CreateTagInput } from "shared";
import { CreateTagInputSchema } from "shared";
import { createTag } from "../../services/tagService.js";
import { sendSuccess } from "../shared/responses.js";
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
  const context = validate(req, res);
  if (!context) return;
  const tag = await createTag(context.input, context.canvasId);
  sendSuccess(res, tag, 201);
}
