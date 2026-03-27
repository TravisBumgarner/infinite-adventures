import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./delete.js";
import { handler as getHandler } from "./get.js";
import { handler as listHandler } from "./list.js";
import { handler as searchHandler } from "./search.js";
import { handler as taggedHandler } from "./tagged.js";
import { handler as updateHandler } from "./update.js";

// Canvas-scoped item routes: mounted at /api/canvases/:canvasId/items
const canvasItemsRouter = Router({ mergeParams: true });
canvasItemsRouter.use(requireAuth);
canvasItemsRouter.get("/search", searchHandler);
canvasItemsRouter.get("/", listHandler);
canvasItemsRouter.post("/", createHandler);

// Global item routes: mounted at /api/items
const itemsRouter = Router();
itemsRouter.use(requireAuth);
itemsRouter.get("/:id", getHandler);
itemsRouter.get("/:id/tagged", taggedHandler);
itemsRouter.put("/:id", updateHandler);
itemsRouter.delete("/:id", deleteHandler);

export { canvasItemsRouter, itemsRouter };
