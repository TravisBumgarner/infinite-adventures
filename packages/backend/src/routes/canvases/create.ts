import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { createCanvas } from "../../services/canvasService.js";
import { requireUserId } from "../shared/auth.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";
import { CanvasNameBody } from "../shared/validation.js";

export interface CreateValidationContext {
  name: string;
  userId: string;
}

export function validate(req: Request, res: Response): CreateValidationContext | null {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return null;
  const bodyResult = CanvasNameBody.safeParse(req.body);
  if (!bodyResult.success) {
    sendBadRequest(res);
    return null;
  }
  return { name: bodyResult.data.name, userId: auth.userId };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: CreateValidationContext,
): Promise<void> {
  const canvas = await createCanvas(context.name, context.userId);
  sendSuccess(res, canvas, 201);
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
