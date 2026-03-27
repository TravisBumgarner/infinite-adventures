import type { ImportCanvasResult } from "shared";
import config from "../config.js";
import { getAuthHeaders } from "./http.js";

export async function exportCanvas(canvasId: string): Promise<Blob> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${config.apiBaseUrl}/canvases/${canvasId}/export`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.blob();
}

export async function importCanvas(file: File): Promise<ImportCanvasResult> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${config.apiBaseUrl}/canvases/import`, {
    method: "POST",
    headers: { ...authHeaders },
    body: formData,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.errorCode || `HTTP ${res.status}`);
  }
  return body.data as ImportCanvasResult;
}
