import express from "express";
import cors from "cors";
import { initDb } from "./db/connection.js";
import { notesRouter } from "./routes/notes.js";

const PORT = parseInt(process.env["PORT"] || "3001", 10);

const app = express();
app.use(cors());
app.use(express.json());

initDb();

app.use("/api/notes", notesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
