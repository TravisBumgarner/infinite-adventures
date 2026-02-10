import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as listHandler } from "./list.js";

// Canvas-scoped timeline routes: mounted at /api/canvases/:canvasId/timeline
const timelineRouter = Router({ mergeParams: true });
timelineRouter.use(requireAuth);
timelineRouter.get("/", listHandler);

export { timelineRouter };
