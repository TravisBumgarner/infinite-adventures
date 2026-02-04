# Canvas Items Refactor

## Overview

Refactor the current `notes` table into a more flexible `canvas_items` system with type-specific content tables for D&D campaign management.

## Current State

- Single `notes` table with a `type` enum field (pc, npc, item, quest, location, goal, session)
- `note_links` table for @mention relationships
- All note data stored in one table with shared fields

## Target State

### Database Schema

#### `canvas_items` (base table)
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | Primary key |
| type | text | Enum: 'person', 'place', 'thing', 'session', 'event' |
| title | text | Required |
| canvas_x | double precision | Default 0 |
| canvas_y | double precision | Default 0 |
| canvas_id | text | FK to canvases.id, required |
| user_id | text | FK to users.id |
| content_id | text | FK to type-specific table |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |
| search_vector | tsvector | Generated, indexes title |

#### Type-specific content tables

Each content table (`people`, `places`, `things`, `sessions`, `events`) has:

| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | Primary key |
| notes | text | Rich text (Tiptap JSON/HTML) |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

#### `photos`
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | Primary key |
| content_type | text | Which content table: 'person', 'place', etc. |
| content_id | text | ID in the content table |
| filename | text | Stored filename |
| original_name | text | Original upload name |
| mime_type | text | e.g., 'image/jpeg' |
| is_selected | boolean | Default false, only one per content item |
| created_at | text | ISO timestamp |

Photos stored in filesystem at `backend/uploads/photos/{id}.{ext}` and served via Express.

#### `canvas_item_links` (renamed from `note_links`)
| Column | Type | Notes |
|--------|------|-------|
| source_item_id | text | FK to canvas_items.id |
| target_item_id | text | FK to canvas_items.id |
| snippet | text | Context around the mention, e.g., "...and then @Gandalf cast a spell..." |
| created_at | text | ISO timestamp |

Primary key: (source_item_id, target_item_id)

### Snippet Extraction

When a @mention is detected in content, extract surrounding context:
- Find the mention position in plain text
- Extract N words before and N words after (configurable, default ~10 words each direction)
- Store as snippet in `canvas_item_links`
- Display snippets when viewing an item's "mentioned in" section

### Data Migration

Map existing note types to new types:
- `pc`, `npc` → `person`
- `item` → `thing`
- `quest`, `goal` → `event`
- `location` → `place`
- `session` → `session`

Migration steps:
1. Create new tables
2. For each existing note:
   - Create content record in appropriate type table
   - Create canvas_item record linking to content
3. Migrate note_links to canvas_item_links (snippets will be null initially)
4. Drop old notes table

### API Changes

#### New/Updated Endpoints

**Canvas Items:**
- `GET /api/canvases/:canvasId/items` - List items for canvas
- `GET /api/canvases/:canvasId/items/search` - Search items
- `POST /api/canvases/:canvasId/items` - Create item (with type)
- `GET /api/items/:id` - Get item with content and links
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

**Photos:**
- `POST /api/items/:id/photos` - Upload photo
- `DELETE /api/photos/:id` - Delete photo
- `PUT /api/photos/:id/select` - Set as selected photo
- `GET /api/photos/:id` - Serve photo file

### Frontend Changes

- Update `NoteNode` → `CanvasItemNode` component
- Update editor to handle type-specific content
- Add photo upload/management UI
- Display selected photo on canvas card
- Show mention snippets in "mentioned in" section
