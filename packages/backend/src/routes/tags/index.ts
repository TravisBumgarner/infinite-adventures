import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as assignHandler } from "./assign.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./delete.js";
import { handler as listHandler } from "./list.js";
import { handler as removeHandler } from "./remove.js";
import { handler as updateHandler } from "./update.js";

// Canvas-scoped tag routes: mounted at /api/canvases/:canvasId/tags
const canvasTagsRouter = Router({ mergeParams: true });
canvasTagsRouter.use(requireAuth);
canvasTagsRouter.get("/", listHandler);
canvasTagsRouter.post("/", createHandler);
canvasTagsRouter.put("/:tagId", updateHandler);
canvasTagsRouter.delete("/:tagId", deleteHandler);

// Item-tag assignment routes: mounted at /api/items/:itemId/tags
const itemTagsRouter = Router({ mergeParams: true });
itemTagsRouter.use(requireAuth);
itemTagsRouter.put("/:tagId", assignHandler);
itemTagsRouter.delete("/:tagId", removeHandler);

export { canvasTagsRouter, itemTagsRouter };
