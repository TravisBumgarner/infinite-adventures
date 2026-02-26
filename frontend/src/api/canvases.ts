import type { Canvas, CanvasSummary, CreateCanvasInput, UpdateCanvasInput } from "shared";
import { request } from "./http.js";

export function fetchCanvases(): Promise<CanvasSummary[]> {
  return request<CanvasSummary[]>("/canvases");
}

export function createCanvas(input: CreateCanvasInput): Promise<Canvas> {
  return request<Canvas>("/canvases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCanvas(id: string, input: UpdateCanvasInput): Promise<Canvas> {
  return request<Canvas>(`/canvases/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCanvas(id: string): Promise<void> {
  return request<void>(`/canvases/${id}`, { method: "DELETE" });
}
