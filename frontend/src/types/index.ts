export type NoteType =
  | "pc"
  | "npc"
  | "item"
  | "quest"
  | "location"
  | "goal"
  | "session";

export interface NoteSummary {
  id: string;
  type: NoteType;
  title: string;
  canvas_x: number;
  canvas_y: number;
}

export interface NoteLink {
  id: string;
  title: string;
  type: NoteType;
}

export interface Note extends NoteSummary {
  content: string;
  created_at: string;
  updated_at: string;
  links_to: NoteLink[];
  linked_from: NoteLink[];
}

export interface CreateNoteInput {
  type: NoteType;
  title: string;
  content?: string;
  canvas_x?: number;
  canvas_y?: number;
}

export interface UpdateNoteInput {
  type?: NoteType;
  title?: string;
  content?: string;
  canvas_x?: number;
  canvas_y?: number;
}
