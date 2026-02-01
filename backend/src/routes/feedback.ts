import type { Request, Response } from "express";
import { Router } from "express";
import { createFeedback, ValidationError } from "../services/feedbackService.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const result = createFeedback(message ?? "");
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});
