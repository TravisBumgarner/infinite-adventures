import type {
  CanvasItem,
  CanvasItemSearchResult,
  CanvasItemSummary,
  CanvasItemType,
  CreateCanvasItemInput,
  UpdateCanvasItemInput,
} from "shared";

export const DEFAULT_CANVAS_ID = "00000000-0000-4000-8000-000000000000";

const VALID_TYPES = ["person", "place", "thing", "session", "event"] as const;

export function isValidCanvasItemType(type: string): type is CanvasItemType {
  return (VALID_TYPES as readonly string[]).includes(type);
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * List all canvas items for a canvas (summary view without content).
 */
export async function listItems(_canvasId: string): Promise<CanvasItemSummary[]> {
  throw new Error("Not implemented");
}

/**
 * Get a single canvas item with full content, photos, and links.
 */
export async function getItem(_id: string): Promise<CanvasItem | null> {
  throw new Error("Not implemented");
}

/**
 * Create a new canvas item with its type-specific content.
 */
export async function createItem(
  _input: CreateCanvasItemInput,
  _canvasId: string,
): Promise<CanvasItemSummary> {
  throw new Error("Not implemented");
}

/**
 * Update a canvas item's title, position, or content notes.
 */
export async function updateItem(
  _id: string,
  _input: UpdateCanvasItemInput,
): Promise<CanvasItemSummary | null> {
  throw new Error("Not implemented");
}

/**
 * Delete a canvas item and its associated content and photos.
 */
export async function deleteItem(_id: string): Promise<boolean> {
  throw new Error("Not implemented");
}

/**
 * Search canvas items by title within a canvas.
 */
export async function searchItems(
  _query: string,
  _canvasId: string,
): Promise<CanvasItemSearchResult[]> {
  throw new Error("Not implemented");
}
