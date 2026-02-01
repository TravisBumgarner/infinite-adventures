import { Router } from "express";
import type { Request, Response } from "express";
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  ValidationError,
} from "../services/noteService.js";

export const notesRouter = Router();

notesRouter.get("/", (_req: Request, res: Response) => {
  const notes = listNotes();
  res.json(notes);
});

notesRouter.get("/:id", (req: Request, res: Response) => {
  const note = getNote(req.params["id"]!);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(note);
});

notesRouter.post("/", (req: Request, res: Response) => {
  try {
    const note = createNote(req.body);
    res.status(201).json(note);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

notesRouter.put("/:id", (req: Request, res: Response) => {
  try {
    const note = updateNote(req.params["id"]!, req.body);
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json(note);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

notesRouter.delete("/:id", (req: Request, res: Response) => {
  const deleted = deleteNote(req.params["id"]!);
  if (!deleted) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.status(200).json({ success: true });
});
