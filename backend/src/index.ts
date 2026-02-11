import "dotenv/config";
import * as Sentry from "@sentry/node";
import cors from "cors";
import express from "express";
import multer from "multer";
import config from "./config.js";
import { initDb } from "./db/connection.js";
import { logger } from "./lib/logger.js";
import { canvasesRouter } from "./routes/canvases/index.js";
import { galleryRouter } from "./routes/gallery/index.js";
import { canvasItemsRouter, itemsRouter } from "./routes/items/index.js";
import { linksRouter } from "./routes/links/index.js";
import { itemNotesRouter, notesRouter } from "./routes/notes/index.js";
import { itemPhotosRouter, photosRouter } from "./routes/photos/index.js";
import { quickNotesRouter } from "./routes/quickNotes/index.js";
import { sessionsRouter } from "./routes/sessions/index.js";
import { canvasTagsRouter, itemTagsRouter } from "./routes/tags/index.js";
import { timelineRouter } from "./routes/timeline/index.js";

Sentry.init({
  dsn: "https://6ef02465e2d32a4e41d39e0fdd83f73e@o196886.ingest.us.sentry.io/4510862831386624",
  sendDefaultPii: true,
});

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

// Gallery routes
app.use("/api/canvases/:canvasId/gallery", galleryRouter);

// Note routes
app.use("/api/notes", notesRouter);
app.use("/api/items/:itemId/notes", itemNotesRouter);

// Photo routes
app.use("/api/photos", photosRouter);
app.use("/api/items/:itemId/photos", upload.single("photo"), itemPhotosRouter);

// Quick notes routes
app.use("/api/canvases/:canvasId/quick-notes", quickNotesRouter);

// Tag routes
app.use("/api/canvases/:canvasId/tags", canvasTagsRouter);
app.use("/api/items/:itemId/tags", itemTagsRouter);

// Link routes
app.use("/api/links", linksRouter);

Sentry.setupExpressErrorHandler(app);

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

export default app;
