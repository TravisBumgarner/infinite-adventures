import type { CanvasItemType, NoteType } from "shared";

export const SIDEBAR_WIDTH = 360;

// Legacy note type labels (to be removed after migration)
export const TYPE_LABELS: Record<NoteType, string> = {
  pc: "PC",
  npc: "NPC",
  item: "Item",
  quest: "Quest",
  location: "Location",
  goal: "Goal",
  session: "Session",
};

// Canvas item type labels (new)
export const CANVAS_ITEM_TYPE_LABELS: Record<CanvasItemType, string> = {
  person: "Person",
  place: "Place",
  thing: "Thing",
  session: "Session",
  event: "Event",
};

// Canvas item types for dropdowns
export const CANVAS_ITEM_TYPES: { value: CanvasItemType; label: string }[] = [
  { value: "person", label: "Person" },
  { value: "place", label: "Place" },
  { value: "thing", label: "Thing" },
  { value: "session", label: "Session" },
  { value: "event", label: "Event" },
];

export const NOTE_TEMPLATES: Record<NoteType, string> = {
  pc: "Race:\nClass:\nBackground:\n",
  npc: "Race:\nRole:\nDescription:\n",
  item: "Description:\nProperties:\n",
  quest: "Objective:\nReward:\n",
  location: "Description:\nNotable Features:\n",
  goal: "",
  session: "Date:\nSummary:\n",
};

export const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "pc", label: "PC" },
  { value: "npc", label: "NPC" },
  { value: "item", label: "Item" },
  { value: "quest", label: "Quest" },
  { value: "location", label: "Location" },
  { value: "goal", label: "Goal" },
  { value: "session", label: "Session" },
];
