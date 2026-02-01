import type { NoteType } from "./types";

export const SIDEBAR_WIDTH = 360;

export const TYPE_LABELS: Record<NoteType, string> = {
  pc: "PC",
  npc: "NPC",
  item: "Item",
  quest: "Quest",
  location: "Location",
  goal: "Goal",
  session: "Session",
};

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
