import type { Request, Response } from "express";
import { createCanvas } from "../../services/canvasService.js";
import { sendBadRequest, sendSuccess } from "../shared/responses.js";

export interface CreateValidationContext {
  name: string;
}

export function validate(req: Request, res: Response): CreateValidationContext | null {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    sendBadRequest(res);
    return null;
  }
  return { name: name.trim() };
}

export async function processRequest(
  _req: Request,
  res: Response,
  context: CreateValidationContext,
): Promise<void> {
  const canvas = await createCanvas(context.name);
  sendSuccess(res, canvas, 201);
}

export async function handler(req: Request, res: Response): Promise<void> {
  const context = validate(req, res);
  if (!context) return;
  await processRequest(req, res, context);
}
