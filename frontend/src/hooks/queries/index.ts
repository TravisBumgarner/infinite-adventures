import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchCanvases,
  fetchItem,
  fetchItems,
  fetchSessions,
  fetchTaggedItems,
  fetchTags,
  fetchTimeline,
  fetchTimelineCounts,
  searchItems,
} from "../../api/client.js";
import { queryKeys } from "./queryKeys.js";

export { queryKeys } from "./queryKeys.js";

export function useCanvases() {
  return useQuery({
    queryKey: queryKeys.canvases.all,
    queryFn: fetchCanvases,
  });
}

export function useItems(canvasId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.items.list(canvasId!),
    queryFn: () => fetchItems(canvasId!),
    enabled: !!canvasId,
  });
}

export function useItem(itemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.items.detail(itemId!),
    queryFn: () => fetchItem(itemId!),
    enabled: !!itemId,
  });
}

export function useSearchItems(query: string, canvasId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.items.search(canvasId!, query),
    queryFn: () => searchItems(query, canvasId!),
    enabled: !!canvasId,
    placeholderData: keepPreviousData,
  });
}

export function useTimeline(
  canvasId: string | undefined,
  sort: "created_at" | "updated_at" = "created_at",
) {
  return useInfiniteQuery({
    queryKey: queryKeys.timeline.list(canvasId!, sort),
    queryFn: ({ pageParam }) => fetchTimeline(canvasId!, sort, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!canvasId,
  });
}

export function useTimelineCounts(canvasId: string | undefined, start: string, end: string) {
  return useQuery({
    queryKey: queryKeys.timeline.counts(canvasId!, start, end),
    queryFn: () => fetchTimelineCounts(canvasId!, start, end),
    enabled: !!canvasId,
  });
}

export function useSessions(canvasId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions.list(canvasId!),
    queryFn: () => fetchSessions(canvasId!),
    enabled: !!canvasId,
  });
}

export function useTags(canvasId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tags.list(canvasId!),
    queryFn: () => fetchTags(canvasId!),
    enabled: !!canvasId,
  });
}

export function useTaggedItems(itemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.taggedItems.list(itemId!),
    queryFn: () => fetchTaggedItems(itemId!),
    enabled: !!itemId,
  });
}
