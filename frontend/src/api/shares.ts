import type { ImportCanvasResult, Share, SharedContent } from "shared";
import { request } from "./http.js";

export function createShare(canvasId: string, itemId?: string): Promise<Share> {
  return request<Share>("/shares", {
    method: "POST",
    body: JSON.stringify({ canvasId, itemId }),
  });
}

export function listShares(canvasId: string): Promise<Share[]> {
  return request<Share[]>(`/shares?canvasId=${canvasId}`);
}

export function deleteShare(shareId: string): Promise<void> {
  return request<void>(`/shares/${shareId}`, { method: "DELETE" });
}

export function fetchSharedContent(token: string): Promise<SharedContent> {
  return request<SharedContent>(`/shared/${token}`);
}

export function copySharedContent(token: string): Promise<ImportCanvasResult> {
  return request<ImportCanvasResult>(`/shared/${token}/copy`, { method: "POST" });
}
