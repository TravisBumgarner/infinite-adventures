import type { Tag } from "shared";
import { create } from "zustand";

interface TagState {
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  setTags: (tags) => set({ tags }),
  addTag: (tag) => set((s) => ({ tags: [...s.tags, tag] })),
  updateTag: (tag) =>
    set((s) => ({
      tags: s.tags.map((t) => (t.id === tag.id ? tag : t)),
    })),
  removeTag: (tagId) =>
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== tagId),
    })),
}));
