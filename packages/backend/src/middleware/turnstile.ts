import type { NextFunction, Request, Response } from "express";
import config from "../config.js";

export async function requireTurnstile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers["cf-turnstile-token"] as string | undefined;
  if (!token) {
    res.status(403).json({ success: false, errorCode: "TURNSTILE_FAILED" });
    return;
  }

  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: config.cloudflareTurnstileSecretKey,
      response: token,
      remoteip: req.ip,
    }),
  });

  const result = (await verifyRes.json()) as { success: boolean };
  if (!result.success) {
    res.status(403).json({ success: false, errorCode: "TURNSTILE_FAILED" });
    return;
  }

  next();
}
