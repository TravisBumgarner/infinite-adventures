import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as deleteHandler, validate as deleteValidate } from "./delete.js";
import { handler as importantHandler } from "./important.js";
import { handler as selectHandler, validate as selectValidate } from "./select.js";
import { handler as serveHandler } from "./serve.js";
import { handler as uploadHandler, validate as uploadValidate } from "./upload.js";

// Photo routes: mounted at /api/photos and /api/items/:itemId/photos
const photosRouter = Router();

// Public route for serving photos (no auth required)
photosRouter.get("/:filename", serveHandler);

// Protected routes
photosRouter.use(requireAuth);
photosRouter.delete("/:id", deleteHandler);
photosRouter.put("/:id/select", selectHandler);
photosRouter.put("/:id/important", importantHandler);

// Item-scoped photo upload: mounted at /api/items/:itemId/photos
const itemPhotosRouter = Router({ mergeParams: true });
itemPhotosRouter.use(requireAuth);
itemPhotosRouter.post("/", uploadHandler);

export { photosRouter, itemPhotosRouter, deleteValidate, selectValidate, uploadValidate };
