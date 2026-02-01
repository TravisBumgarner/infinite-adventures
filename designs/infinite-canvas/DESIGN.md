# Infinite Adventures — Design Document

## Overview

Infinite Adventures is an infinite-canvas note-taking app for Dungeons & Dragons campaigns. Players create typed notes (PCs, NPCs, items, quests, locations, goals, session notes) on a pannable/zoomable canvas. Notes link to each other via `@mentions` in their content, forming a knowledge graph of campaign information.

## Core Features

### 1. Infinite Canvas
- Pan and zoom across an unlimited 2D workspace
- Notes are draggable nodes on the canvas
- Links between notes render as edges/connections between nodes
- Canvas position and zoom level persist across sessions

### 2. Note Types
Each note has a **type** that determines its icon/color on the canvas:

| Type          | Description                              |
|---------------|------------------------------------------|
| PC            | Player character                         |
| NPC           | Non-player character                     |
| Item          | Weapons, armor, potions, artifacts, etc. |
| Quest         | Active or completed quests               |
| Location      | Towns, dungeons, regions, planes         |
| Goal          | Campaign or character goals              |
| Session Notes | Per-session play notes and recaps        |

### 3. @Mention Linking
- Typing `@` in a note's content opens an autocomplete dropdown of existing note titles
- Selecting a note inserts a link reference (e.g., `@Gandalf`)
- If the typed name doesn't match an existing note, an option to "Create new note" appears
- Clicking a created `@mention` navigates to (centers canvas on) the linked note
- Links are bidirectional in display — if Note A mentions Note B, both notes show the connection

### 4. Search
- A search bar in the top-left corner of the canvas
- Searches across all note titles and content (full-text)
- Results appear as a dropdown list
- Clicking a result centers the canvas on that note

## Architecture

### Stack
- **Frontend**: React 18 + TypeScript, Vite, React Flow
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via better-sqlite3, with FTS5 for full-text search
- **Monorepo**: Single repo with `frontend/` and `backend/` directories

### Project Structure
```
infinite-adventures/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.tsx          # React Flow canvas wrapper
│   │   │   ├── NoteNode.tsx        # Custom React Flow node for notes
│   │   │   ├── NoteEditor.tsx      # Note editing panel/modal
│   │   │   ├── SearchBar.tsx       # Top-left search input
│   │   │   ├── MentionInput.tsx    # @mention-aware text input
│   │   │   └── App.tsx             # Root component
│   │   ├── hooks/
│   │   │   ├── useNotes.ts         # CRUD operations for notes
│   │   │   ├── useSearch.ts        # Search hook
│   │   │   └── useCanvas.ts        # Canvas state (viewport, etc.)
│   │   ├── types/
│   │   │   └── index.ts            # Shared TypeScript types
│   │   ├── api/
│   │   │   └── client.ts           # HTTP client for backend API
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql          # Table definitions + FTS5
│   │   │   ├── connection.ts       # SQLite connection setup
│   │   │   └── migrations.ts       # Schema migration runner
│   │   ├── routes/
│   │   │   ├── notes.ts            # CRUD + search endpoints
│   │   │   └── links.ts            # Link management endpoints
│   │   ├── services/
│   │   │   ├── noteService.ts      # Business logic for notes
│   │   │   └── linkService.ts      # Business logic for links
│   │   └── index.ts                # Express app entry point
│   ├── package.json
│   └── tsconfig.json
├── designs/
├── .claude/
├── .gitmodules
└── package.json                    # Root workspace config (optional)
```

## Data Model

### `notes` table
| Column     | Type    | Description                                        |
|------------|---------|----------------------------------------------------|
| id         | TEXT    | UUID primary key                                   |
| type       | TEXT    | One of: pc, npc, item, quest, location, goal, session |
| title      | TEXT    | Note title (used for @mention matching)            |
| content    | TEXT    | Note body text (markdown-like, contains @mentions) |
| canvas_x   | REAL    | X position on canvas                               |
| canvas_y   | REAL    | Y position on canvas                               |
| created_at | TEXT    | ISO 8601 timestamp                                 |
| updated_at | TEXT    | ISO 8601 timestamp                                 |

### `note_links` table
| Column         | Type | Description                           |
|----------------|------|---------------------------------------|
| source_note_id | TEXT | FK to notes.id — the note containing the @mention |
| target_note_id | TEXT | FK to notes.id — the note being mentioned         |

Primary key: `(source_note_id, target_note_id)`

### `notes_fts` (FTS5 virtual table)
Full-text search index over `title` and `content` columns of `notes`. Kept in sync via triggers.

### Schema SQL
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('pc', 'npc', 'item', 'quest', 'location', 'goal', 'session')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  canvas_x REAL NOT NULL DEFAULT 0,
  canvas_y REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE note_links (
  source_note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  PRIMARY KEY (source_note_id, target_note_id)
);

CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
END;

CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;
```

## API Endpoints

### Notes

| Method | Path              | Description                |
|--------|-------------------|----------------------------|
| GET    | /api/notes        | List all notes (id, type, title, canvas_x, canvas_y) |
| GET    | /api/notes/:id    | Get a single note with full content and links |
| POST   | /api/notes        | Create a new note          |
| PUT    | /api/notes/:id    | Update a note (title, content, type, position) |
| DELETE | /api/notes/:id    | Delete a note and its links |
| GET    | /api/notes/search?q=term | Full-text search across notes |

### Request/Response Shapes

**POST /api/notes**
```json
{
  "type": "npc",
  "title": "Gandalf",
  "content": "A wizard who helps the party. Often seen near @Rivendell.",
  "canvas_x": 150.0,
  "canvas_y": 300.0
}
```

**GET /api/notes/:id** (response)
```json
{
  "id": "uuid-here",
  "type": "npc",
  "title": "Gandalf",
  "content": "A wizard who helps the party. Often seen near @Rivendell.",
  "canvas_x": 150.0,
  "canvas_y": 300.0,
  "created_at": "2026-01-31T12:00:00Z",
  "updated_at": "2026-01-31T12:00:00Z",
  "links_to": [{"id": "uuid-rivendell", "title": "Rivendell", "type": "location"}],
  "linked_from": [{"id": "uuid-frodo", "title": "Frodo", "type": "pc"}]
}
```

**GET /api/notes/search?q=wizard** (response)
```json
{
  "results": [
    {"id": "uuid-gandalf", "type": "npc", "title": "Gandalf", "snippet": "A <b>wizard</b> who helps the party..."}
  ]
}
```

## Link Resolution

When a note is saved (POST or PUT), the backend:
1. Parses the `content` for `@mentions` using the regex `/@([\w\s]+?)(?=\s@|[.,!?\s]|$)/g`
2. For each mention, looks up a note by exact title match (case-insensitive)
3. If found: creates an entry in `note_links` (if not already present)
4. If not found: creates a new note with that title (type defaults to `npc`, positioned near the source note) and links to it
5. Removes any `note_links` entries for mentions that were removed from the content

## UI Behavior

### Canvas
- React Flow with custom node type (`NoteNode`)
- Each note renders as a card showing: type icon/badge, title, and a content preview (first ~50 chars)
- Edges (connections) drawn between linked notes
- Double-click on empty canvas creates a new note at that position
- Double-click on a note opens the editor

### Note Editor
- Opens as a side panel or modal when a note is selected
- Fields: title (text input), type (dropdown), content (textarea with @mention support)
- Auto-saves on blur or after a debounce period
- Delete button with confirmation

### @Mention Input
- In the content textarea, typing `@` triggers an autocomplete popup
- The popup shows matching note titles filtered as the user types
- Selecting a result inserts the `@Title` text
- If no match, shows "Create [typed text]" option
- @mentions in the rendered content are styled as links (clickable to navigate)

### Search Bar
- Fixed position in top-left corner, above the canvas
- Debounced input calls `/api/notes/search?q=...`
- Results dropdown shows note title, type badge, and snippet
- Clicking a result calls `reactFlowInstance.fitView({ nodes: [targetNodeId] })` or `setCenter(x, y, { zoom })` to navigate to it
