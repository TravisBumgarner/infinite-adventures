import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./delete.js";
import { handler as exportHandler } from "./export.js";
import { handler as getHandler } from "./get.js";
import { handler as importHandler } from "./import.js";
import { handler as listHandler } from "./list.js";
import { handler as updateHandler } from "./update.js";

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth);
router.get("/", listHandler);
router.get("/:id/export", exportHandler);
router.get("/:id", getHandler);
router.post("/", createHandler);
router.post("/import", importUpload.single("file"), importHandler);
router.put("/:id", updateHandler);
router.delete("/:id", deleteHandler);

export { router as canvasesRouter };
