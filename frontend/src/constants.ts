import type { NoteType } from "./types";

export const TYPE_COLORS: Record<NoteType, string> = {
  pc: "#4a90d9",
  npc: "#d94a4a",
  item: "#d9a74a",
  quest: "#8b5cf6",
  location: "#22c55e",
  goal: "#ec4899",
  session: "#6b7280",
};

export const TYPE_LABELS: Record<NoteType, string> = {
  pc: "PC",
  npc: "NPC",
  item: "Item",
  quest: "Quest",
  location: "Location",
  goal: "Goal",
  session: "Session",
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
