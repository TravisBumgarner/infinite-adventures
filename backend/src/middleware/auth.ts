import type { NextFunction, Request, Response } from "express";
import { getOrCreateUserByAuth } from "../db/queries/users.js";
import { supabase } from "../lib/supabase.js";
import { sendUnauthorized } from "../routes/shared/responses.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    authId: string;
    userId: string;
    email: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!supabase) {
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
    authId: user.auth_id,
    userId: user.id,
    email: user.email,
  };

  next();
}
