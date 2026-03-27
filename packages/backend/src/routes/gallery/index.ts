import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as listHandler } from "./list.js";

// Canvas-scoped gallery routes: mounted at /api/canvases/:canvasId/gallery
const galleryRouter = Router({ mergeParams: true });
galleryRouter.use(requireAuth);
galleryRouter.get("/", listHandler);

export { galleryRouter };
