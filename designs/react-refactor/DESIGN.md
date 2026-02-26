# React Refactor — Extract Shared Hooks & Reduce Duplication

## Goal
Extract duplicated logic from `CanvasItemPanel.tsx` (867 lines), `SessionDetail.tsx` (640 lines), and `QuickNotes.tsx` (439 lines) into shared hooks. Standardize inline delete confirmation dialogs across 4 files.

## Current State
- `CanvasItemPanel` and `SessionDetail` share ~300 lines of nearly identical code: auto-save setup, photo CRUD handlers, note list handlers, and refetch-and-update patterns.
- `QuickNotes` duplicates a subset of the auto-save pattern.
- 3 files use inline `useState` + `Dialog` for delete confirmations instead of a shared component.
- `DRAFT_NOTE_ID = "__draft__"` is defined identically in both `CanvasItemPanel` and `SessionDetail`.

## Extractions

### 1. `useNoteHandlers` hook
**Source**: `CanvasItemPanel.tsx` lines 444-485, `SessionDetail.tsx` lines 258-310

Consolidates:
- `handleAddNote` — sets draft note ID, initializes empty content
- `handleSelectNote` — sets editing note ID, loads content into refs
- `handleDeleteNote` — handles draft vs persisted, calls delete mutation, refetches
- `handleBackToNoteList` — flushes auto-save, clears editing state

**Interface**:
```ts
useNoteHandlers({
  itemId: string,
  noteContentRef: MutableRefObject<string>,
  noteTitleRef: MutableRefObject<string>,
  editingNoteIdRef: MutableRefObject<string | null>,
  flushNote: () => void,
  refetchItem: () => Promise<Item>,
  onItemUpdated?: (item: Item) => void,
}) => {
  handleAddNote, handleSelectNote, handleDeleteNote, handleBackToNoteList,
  editingNoteId, setEditingNoteId
}
```

**Location**: `frontend/src/hooks/useNoteHandlers.ts`

### 2. `usePhotoHandlers` hook
**Source**: `CanvasItemPanel.tsx` lines 285-329, `SessionDetail.tsx` lines 313-367

Consolidates:
- `handlePhotoUpload` — upload mutation + refetch
- `handlePhotoDelete` — delete mutation + refetch
- `handleUpdateCaption` — update mutation + refetch
- `handleTogglePhotoImportant` (SessionDetail only) — toggle mutation + refetch
- `handleFileDrop` (SessionDetail only) — drag-and-drop upload

**Interface**:
```ts
usePhotoHandlers({
  itemId: string,
  refetchItem: () => Promise<Item>,
  onItemUpdated?: (item: Item) => void,
}) => {
  handlePhotoUpload, handlePhotoDelete, handleUpdateCaption,
  handleTogglePhotoImportant, handleFileDrop
}
```

**Location**: `frontend/src/hooks/usePhotoHandlers.ts`

### 3. `DRAFT_NOTE_ID` constant
Move to a shared location so both files import from one place.

**Location**: `frontend/src/constants.ts` (already exists, add constant there)

### 4. `ConfirmDeleteDialog` shared component
**Source**: `QuickNotes.tsx` lines 270-289, `NotesTab.tsx` lines 359-378, `ManageTags.tsx` lines 339-358

All three use the same pattern: `Dialog` with title, message, Cancel button, Delete button.

**Interface**:
```tsx
<ConfirmDeleteDialog
  open={boolean}
  onClose={() => void}
  onConfirm={() => void}
  title?: string        // default: "Confirm Delete"
  message?: string      // default: "Are you sure?"
/>
```

**Location**: `frontend/src/sharedComponents/ConfirmDeleteDialog.tsx`

### 5. Missing barrel exports and localStorage key centralization

**Barrel exports** — 5 of 10 page directories lack `index.ts`: Canvas, Login, Marketing, Signup, PasswordReset. The other 5 (Gallery, Sessions, Timeline, TreeView, NotFound) have them. Add barrel exports and update `Router.tsx` imports.

**localStorage keys** — `"infinite-adventures-theme"` is defined as `STORAGE_KEY` in `Theme.tsx` but also used as a raw string in `main.tsx`. The three localStorage keys (`theme`, `active-canvas`, `onboarding-complete`) are scattered across `Theme.tsx`, `main.tsx`, and `canvasStore.ts`. Centralize all three in `constants.ts`.

## Out of Scope
- Auto-save hook extraction for `QuickNotes` — its pattern is different enough (per-item, snapshot throttling) that forcing it into a shared hook would over-abstract
- Further splitting of `CanvasItemPanel` into sub-tab components — after hook extraction it should be ~500-550 lines, revisit later if needed
- `MentionEditor` splitting — it's cohesive enough at 641 lines with its sub-components already extracted

## Expected Impact
| File | Before | After (est.) |
|------|--------|-------------|
| CanvasItemPanel.tsx | 867 | ~550 |
| SessionDetail.tsx | 640 | ~400 |
| QuickNotes.tsx | 439 | ~410 |
| NotesTab.tsx | 381 | ~360 |
| ManageTags.tsx | 361 | ~340 |
