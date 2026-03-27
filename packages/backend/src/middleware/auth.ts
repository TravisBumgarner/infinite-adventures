import type { NextFunction, Request, Response } from "express";
import config from "../config.js";
import { supabase } from "../lib/supabase.js";
import { sendForbidden, sendInternalError, sendUnauthorized } from "../routes/shared/responses.js";
import { userOwnsCanvas } from "../services/authorizationService.js";
import { getShareByToken } from "../services/shareService.js";
import { getOrCreateUserByAuth } from "../services/userService.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    authId: string;
    userId: string;
    email: string;
  };
  share?: {
    id: string;
    token: string;
    canvasId: string;
    itemId: string | null;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!supabase) {
    if (config.isProduction) {
      sendInternalError(res);
      return;
    }
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendUnauthorized(res);
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    sendUnauthorized(res);
    return;
  }

  const user = await getOrCreateUserByAuth({
    authId: data.user.id,
    email: data.user.email ?? "",
  });

  req.user = {
    authId: user.authId,
    userId: user.id,
    email: user.email,
  };

  next();
}

/**
 * Like requireAuth but does not reject when no token is present.
 * If a valid token is provided, populates req.user. Otherwise continues without it.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!supabase) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    next();
    return;
  }

  const user = await getOrCreateUserByAuth({
    authId: data.user.id,
    email: data.user.email ?? "",
  });

  req.user = {
    authId: user.authId,
    userId: user.id,
    email: user.email,
  };

  next();
}

/**
 * Middleware that checks access via share token or canvas ownership.
 * Expects canvasId from req.params.canvasId or a getter function.
 */
export function requireShareOrOwner(getCanvasId: (req: AuthenticatedRequest) => string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const shareToken =
      (req.query.token as string | undefined) ||
      (req.headers["x-share-token"] as string | undefined);

    if (shareToken) {
      const share = await getShareByToken(shareToken);
      if (share) {
        req.share = {
          id: share.id,
          token: share.token,
          canvasId: share.canvasId,
          itemId: share.itemId,
        };
        next();
        return;
      }
    }

    if (req.user) {
      const canvasId = getCanvasId(req);
      if (canvasId && (await userOwnsCanvas(req.user.userId, canvasId))) {
        next();
        return;
      }
    }

    sendForbidden(res);
  };
}
