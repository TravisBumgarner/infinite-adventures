import type { Canvas as CanvasRow } from "../db/schema.js";

export type CanvasSummary = Pick<CanvasRow, "id" | "name">;

export async function listCanvases(): Promise<CanvasSummary[]> {
  return [];
}

export async function getCanvas(_id: string): Promise<CanvasRow | null> {
  return null;
}

export async function createCanvas(_name: string): Promise<CanvasRow> {
  return { id: "", name: "", created_at: "", updated_at: "" };
}

export async function updateCanvas(_id: string, _name: string): Promise<CanvasRow | null> {
  return null;
}

export async function deleteCanvas(_id: string): Promise<boolean> {
  return false;
}

export class LastCanvasError extends Error {
  constructor() {
    super("Cannot delete the last canvas");
    this.name = "LastCanvasError";
  }
}
