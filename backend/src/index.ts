import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { initDb } from "./db/connection.js";
import { canvasesRouter } from "./routes/canvases/index.js";
import { canvasItemsRouter, itemsRouter } from "./routes/items/index.js";
import { itemPhotosRouter, photosRouter } from "./routes/photos/index.js";

const PORT = parseInt(process.env.PORT || "3021", 10);

// Configure multer for photo uploads (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json());

await initDb();

// Canvas routes
app.use("/api/canvases", canvasesRouter);

// Canvas items routes
app.use("/api/canvases/:canvasId/items", canvasItemsRouter);
app.use("/api/items", itemsRouter);

// Photo routes
app.use("/api/photos", photosRouter);
app.use("/api/items/:itemId/photos", upload.single("photo"), itemPhotosRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
