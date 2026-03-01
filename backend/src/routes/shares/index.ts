import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./deleteShare.js";
import { handler as listHandler } from "./list.js";

const sharesRouter = Router({ mergeParams: true });
sharesRouter.use(requireAuth);
sharesRouter.post("/", createHandler);
sharesRouter.get("/", listHandler);
sharesRouter.delete("/:id", deleteHandler);

export { sharesRouter };
