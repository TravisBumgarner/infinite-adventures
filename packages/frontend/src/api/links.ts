import { request } from "./http.js";

export function createLink(
  sourceItemId: string,
  targetItemId: string,
): Promise<{ created: boolean }> {
  return request<{ created: boolean }>("/links", {
    method: "POST",
    body: JSON.stringify({ sourceItemId, targetItemId }),
  });
}

export function deleteLink(sourceItemId: string, targetItemId: string): Promise<void> {
  return request<void>(`/links/${sourceItemId}/${targetItemId}`, { method: "DELETE" });
}
