import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as countsHandler } from "./counts.js";
import { handler as listHandler } from "./list.js";

// Canvas-scoped timeline routes: mounted at /api/canvases/:canvasId/timeline
const timelineRouter = Router({ mergeParams: true });
timelineRouter.use(requireAuth);
timelineRouter.get("/", listHandler);
timelineRouter.get("/counts", countsHandler);

export { timelineRouter };
