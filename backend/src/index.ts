import cors from "cors";
import express from "express";
import { initDb } from "./db/connection.js";
import { notesRouter } from "./routes/notes/index.js";

const PORT = parseInt(process.env.PORT || "3021", 10);

const app = express();
app.use(cors());
app.use(express.json());

await initDb();

app.use("/api/notes", notesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
