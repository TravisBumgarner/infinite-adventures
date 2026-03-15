import "dotenv/config";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import config from "./config.js";
import { initDb } from "./db/connection.js";
import { logger, shutdownPosthog } from "./lib/logger.js";
import { canvasesRouter } from "./routes/canvases/index.js";
import { galleryRouter } from "./routes/gallery/index.js";
import { canvasItemsRouter, itemsRouter } from "./routes/items/index.js";
import { linksRouter } from "./routes/links/index.js";
import { itemNotesRouter, notesRouter } from "./routes/notes/index.js";
import { itemPhotosRouter, photosRouter } from "./routes/photos/index.js";
import { quickNotesRouter } from "./routes/quickNotes/index.js";
import { sessionsRouter } from "./routes/sessions/index.js";
import { sharedContentRouter } from "./routes/shared-content/index.js";
import { sharesRouter } from "./routes/shares/index.js";
import { canvasTagsRouter, itemTagsRouter } from "./routes/tags/index.js";
import { timelineRouter } from "./routes/timeline/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const s3Origin = `https://${config.s3BucketName}.s3.${config.awsRegion}.amazonaws.com`;

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
        connectSrc: ["'self'", "*.supabase.co", "*.posthog.com", s3Origin],
        imgSrc: ["'self'", "data:", "blob:", s3Origin],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameSrc: ["https://challenges.cloudflare.com"],
      },
    },
  }),
);
app.use(cors({ origin: config.frontendUrl }));
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
app.use("/api/items/:itemId/photos", itemPhotosRouter);

// Quick notes routes
app.use("/api/canvases/:canvasId/quick-notes", quickNotesRouter);

// Tag routes
app.use("/api/canvases/:canvasId/tags", canvasTagsRouter);
app.use("/api/items/:itemId/tags", itemTagsRouter);

// Link routes
app.use("/api/links", linksRouter);

// Share routes
app.use("/api/shares", sharesRouter);
app.use("/api/shared", sharedContentRouter);

// Serve frontend in production
if (config.isProduction) {
  const frontendDist = path.resolve(__dirname, "..", "..", "frontend", "dist");
  app.use(express.static(frontendDist, { index: false }));

  // SPA fallback: serve index.html for all non-API GET requests
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Graceful shutdown
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    await shutdownPosthog();
    process.exit(0);
  });
}

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

export default app;
