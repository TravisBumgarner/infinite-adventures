import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./delete.js";
import { handler as getHandler } from "./get.js";
import { handler as listHandler } from "./list.js";
import { handler as searchHandler } from "./search.js";
import { handler as updateHandler } from "./update.js";

// Canvas-scoped note routes: mounted at /api/canvases/:canvasId/notes
const canvasNotesRouter = Router({ mergeParams: true });
canvasNotesRouter.use(requireAuth);
canvasNotesRouter.get("/search", searchHandler);
canvasNotesRouter.get("/", listHandler);
canvasNotesRouter.post("/", createHandler);

// Global note routes: mounted at /api/notes
const notesRouter = Router();
notesRouter.use(requireAuth);
notesRouter.get("/:id", getHandler);
notesRouter.put("/:id", updateHandler);
notesRouter.delete("/:id", deleteHandler);

export { canvasNotesRouter, notesRouter };
