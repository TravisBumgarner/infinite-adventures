import type { Tag } from "shared";
import { create } from "zustand";

interface TagState {
  tags: Record<string, Tag>;
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
}

export const useTagStore = create<TagState>((set) => ({
  tags: {},
  setTags: (tags) => set({ tags: Object.fromEntries(tags.map((t) => [t.id, t])) }),
  addTag: (tag) => set((s) => ({ tags: { ...s.tags, [tag.id]: tag } })),
  updateTag: (tag) => set((s) => ({ tags: { ...s.tags, [tag.id]: tag } })),
  removeTag: (tagId) =>
    set((s) => {
      const { [tagId]: _, ...rest } = s.tags;
      return { tags: rest };
    }),
}));
