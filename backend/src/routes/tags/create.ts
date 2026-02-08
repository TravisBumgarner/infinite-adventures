import type { Request, Response } from "express";
import type { CreateTagInput } from "shared";
import { createTag } from "../../services/tagService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";

export interface CreateTagValidationContext {
  input: CreateTagInput;
  canvasId: string;
}

export function validate(req: Request, res: Response): CreateTagValidationContext | null {
  const { name, icon, color } = req.body;
  const canvasIdParam = req.params.canvasId;
  const canvasId = typeof canvasIdParam === "string" ? canvasIdParam : "";
  if (!name || !icon || !color) {
    sendBadRequest(res);
    return null;
  }
  return { input: { name, icon, color }, canvasId };
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  const tag = await createTag(context.input, context.canvasId);
  sendSuccess(res, tag, 201);
}
