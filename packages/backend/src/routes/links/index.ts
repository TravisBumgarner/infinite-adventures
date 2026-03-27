import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as createHandler } from "./create.js";
import { handler as deleteHandler } from "./delete.js";

const linksRouter = Router();
linksRouter.use(requireAuth);
linksRouter.post("/", createHandler);
linksRouter.delete("/:sourceItemId/:targetItemId", deleteHandler);

export { linksRouter };
