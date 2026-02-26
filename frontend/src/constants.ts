import type { CanvasItemType } from "shared";

export const SIDEBAR_WIDTH = 360;

export const DRAFT_NOTE_ID = "__draft__";

export const CANVAS_ITEM_TYPE_LABELS: Record<CanvasItemType, string> = {
  person: "Person",
  place: "Place",
  thing: "Thing",
  session: "Session",
  event: "Event",
};

export const CANVAS_ITEM_TYPES: { value: CanvasItemType; label: string }[] = [
  { value: "person", label: "Person" },
  { value: "place", label: "Place" },
  { value: "thing", label: "Thing" },
  { value: "session", label: "Session" },
  { value: "event", label: "Event" },
];
