import type { CanvasItemType } from "../db/schema.js";

export const CURRENT_SCHEMA_VERSION = 1;

export interface BackupManifest {
  schemaVersion: number;
  exportedAt: string;
  canvasName: string;
}

export interface BackupData {
  canvas: { id: string; name: string; createdAt: string; updatedAt: string };
  canvasItems: Array<{
    id: string;
    type: CanvasItemType;
    title: string;
    summary: string;
    canvasX: number;
    canvasY: number;
    canvasId: string;
    userId: string | null;
    contentId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  people: Array<{ id: string; createdAt: string; updatedAt: string }>;
  places: Array<{ id: string; createdAt: string; updatedAt: string }>;
  things: Array<{ id: string; createdAt: string; updatedAt: string }>;
  sessions: Array<{ id: string; sessionDate: string; createdAt: string; updatedAt: string }>;
  events: Array<{ id: string; createdAt: string; updatedAt: string }>;
  notes: Array<{
    id: string;
    canvasItemId: string;
    content: string;
    isImportant: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  photos: Array<{
    id: string;
    contentType: CanvasItemType;
    contentId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    isMainPhoto: boolean;
    isImportant: boolean;
    aspectRatio: number | null;
    blurhash: string | null;
    createdAt: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    canvasId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  canvasItemTags: Array<{ canvasItemId: string; tagId: string }>;
  canvasItemLinks: Array<{
    sourceItemId: string;
    targetItemId: string;
    snippet: string | null;
    createdAt: string;
  }>;
}

/**
 * Export a canvas and all its data as a zip buffer.
 */
export async function exportCanvas(_canvasId: string): Promise<Buffer> {
  throw new Error("Not implemented");
}
