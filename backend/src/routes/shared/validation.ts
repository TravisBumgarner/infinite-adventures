import type { Request, Response } from "express";
import { z } from "zod";
import { sendBadRequest } from "./responses.js";

// --- Param Schemas ---

const uuid = z.string().uuid();

export const IdParams = z.object({ id: uuid });
export const CanvasIdParams = z.object({ canvasId: uuid });
export const ItemIdParams = z.object({ itemId: uuid });
export const NoteIdParams = z.object({ noteId: uuid });
export const TagIdParams = z.object({ tagId: uuid });
export const ItemTagParams = z.object({ itemId: uuid, tagId: uuid });
export const LinkParams = z.object({
  sourceItemId: uuid,
  targetItemId: uuid,
});

// --- Body Schemas ---

export const CanvasNameBody = z.object({ name: z.string().trim().min(1) });

// --- parseRoute ---

type ParseRouteConfig<P extends z.ZodType, B extends z.ZodType | undefined> = {
  params: P;
  body?: B;
};

type ParseRouteResult<P extends z.ZodType, B extends z.ZodType | undefined> = {
  params: z.infer<P>;
  body: B extends z.ZodType ? z.infer<B> : undefined;
};

export function parseRoute<P extends z.ZodType, B extends z.ZodType | undefined = undefined>(
  req: Request,
  res: Response,
  config: ParseRouteConfig<P, B>,
): ParseRouteResult<P, B> | null {
  const paramsResult = config.params.safeParse(req.params);
  if (!paramsResult.success) {
    sendBadRequest(res, "INVALID_UUID");
    return null;
  }

  if (config.body) {
    const bodyResult = config.body.safeParse(req.body);
    if (!bodyResult.success) {
      sendBadRequest(res);
      return null;
    }
    return { params: paramsResult.data, body: bodyResult.data } as ParseRouteResult<P, B>;
  }

  return { params: paramsResult.data, body: undefined } as ParseRouteResult<P, B>;
}
