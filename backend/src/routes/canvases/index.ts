import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./delete.js";
import { handler as getHandler } from "./get.js";
import { handler as listHandler } from "./list.js";
import { handler as updateHandler } from "./update.js";

const router = Router();

router.use(requireAuth);
router.get("/", listHandler);
router.get("/:id", getHandler);
router.post("/", createHandler);
router.put("/:id", updateHandler);
router.delete("/:id", deleteHandler);

export { router as canvasesRouter };
