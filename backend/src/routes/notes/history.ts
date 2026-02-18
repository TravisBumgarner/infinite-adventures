import type { Request, Response } from "express";

export async function handler(_req: Request<{ noteId: string }>, _res: Response): Promise<void> {
  throw new Error("Not implemented");
}
