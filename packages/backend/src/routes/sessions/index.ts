import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as listHandler } from "./list.js";

// Canvas-scoped session routes: mounted at /api/canvases/:canvasId/sessions
const sessionsRouter = Router({ mergeParams: true });
sessionsRouter.use(requireAuth);
sessionsRouter.get("/", listHandler);

export { sessionsRouter };
