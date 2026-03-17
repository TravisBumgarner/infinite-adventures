import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { AuthenticatedRequest } from "./auth.js";

const rateLimitResponse = { success: false, errorCode: "RATE_LIMITED" };

export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) =>
    (req as AuthenticatedRequest).user?.userId ?? ipKeyGenerator(req.ip ?? "unknown"),
  message: rateLimitResponse,
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: (req) =>
    (req as AuthenticatedRequest).user?.userId ?? ipKeyGenerator(req.ip ?? "unknown"),
  message: rateLimitResponse,
});

export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  message: rateLimitResponse,
});
