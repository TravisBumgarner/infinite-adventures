import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import { handler as copyHandler } from "./copy.js";
import { handler as viewHandler } from "./view.js";

const sharedContentRouter = Router({ mergeParams: true });
sharedContentRouter.get("/:token", optionalAuth, viewHandler);
sharedContentRouter.post("/:token/copy", requireAuth, copyHandler);

export { sharedContentRouter };
