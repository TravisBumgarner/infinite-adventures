import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { type Feedback, feedback } from "../db/schema.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function createFeedback(message: string): Feedback {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new ValidationError("Message must not be empty");
  }

  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  db.insert(feedback).values({ id, message: trimmed, created_at: now }).run();

  return { id, message: trimmed, created_at: now };
}
