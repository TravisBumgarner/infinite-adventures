import type { Feedback } from "../db/schema.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function createFeedback(_message: string): Feedback {
  throw new Error("Not implemented");
}
