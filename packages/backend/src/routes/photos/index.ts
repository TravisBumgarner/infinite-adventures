import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handler as captionHandler } from "./caption.js";
import { handler as confirmHandler } from "./confirm.js";
import { handler as deleteHandler, validate as deleteValidate } from "./delete.js";
import { handler as importantHandler } from "./important.js";
import { handler as presignHandler } from "./presign.js";
import { handler as selectHandler, validate as selectValidate } from "./select.js";

// Photo routes: mounted at /api/photos
const photosRouter = Router();
photosRouter.use(requireAuth);
photosRouter.delete("/:id", deleteHandler);
photosRouter.put("/:id/select", selectHandler);
photosRouter.put("/:id/important", importantHandler);
photosRouter.put("/:id/caption", captionHandler);

// Item-scoped photo routes: mounted at /api/items/:itemId/photos
const itemPhotosRouter = Router({ mergeParams: true });
itemPhotosRouter.use(requireAuth);
itemPhotosRouter.post("/presign", presignHandler);
itemPhotosRouter.post("/confirm", confirmHandler);

export { deleteValidate, itemPhotosRouter, photosRouter, selectValidate };
