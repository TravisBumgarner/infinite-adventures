import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { initDb } from "./db/connection.js";
import { canvasesRouter } from "./routes/canvases/index.js";
import { canvasItemsRouter, itemsRouter } from "./routes/items/index.js";
import { linksRouter } from "./routes/links/index.js";
import { itemNotesRouter, notesRouter } from "./routes/notes/index.js";
import { itemPhotosRouter, photosRouter } from "./routes/photos/index.js";
import { sessionsRouter } from "./routes/sessions/index.js";
import { canvasTagsRouter, itemTagsRouter } from "./routes/tags/index.js";
import { timelineRouter } from "./routes/timeline/index.js";

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

// Session routes
app.use("/api/canvases/:canvasId/sessions", sessionsRouter);

// Timeline routes
app.use("/api/canvases/:canvasId/timeline", timelineRouter);

// Note routes
app.use("/api/notes", notesRouter);
app.use("/api/items/:itemId/notes", itemNotesRouter);

// Photo routes
app.use("/api/photos", photosRouter);
app.use("/api/items/:itemId/photos", upload.single("photo"), itemPhotosRouter);

// Tag routes
app.use("/api/canvases/:canvasId/tags", canvasTagsRouter);
app.use("/api/items/:itemId/tags", itemTagsRouter);

// Link routes
app.use("/api/links", linksRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
