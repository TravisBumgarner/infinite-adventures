import "dotenv/config";
import cors from "cors";
import express from "express";
import { initDb } from "./db/connection.js";
import { canvasesRouter } from "./routes/canvases/index.js";
import { canvasNotesRouter, notesRouter } from "./routes/notes/index.js";

const PORT = parseInt(process.env.PORT || "3021", 10);

const app = express();
app.use(cors());
app.use(express.json());

await initDb();

app.use("/api/canvases", canvasesRouter);
app.use("/api/canvases/:canvasId/notes", canvasNotesRouter);
app.use("/api/notes", notesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
