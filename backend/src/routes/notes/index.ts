import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./delete.js";
import { handler as getHandler } from "./get.js";
import { handler as listHandler } from "./list.js";
import { handler as updateHandler } from "./update.js";

// Item-scoped note routes: mounted at /api/items/:itemId/notes
const itemNotesRouter = Router({ mergeParams: true });
itemNotesRouter.use(requireAuth);
itemNotesRouter.get("/", listHandler);
itemNotesRouter.post("/", createHandler);

// Global note routes: mounted at /api/notes
const notesRouter = Router();
notesRouter.use(requireAuth);
notesRouter.get("/:noteId", getHandler);
notesRouter.put("/:noteId", updateHandler);
notesRouter.delete("/:noteId", deleteHandler);

export { itemNotesRouter, notesRouter };
