# Canvas Backup & Restore

## Overview

Add per-canvas backup (export) and restore (import) functionality accessible from the Settings sidebar. Export produces a `.zip` file containing all canvas data and photos. Import accepts a previously exported `.zip` and creates a full copy of the canvas with fresh UUIDs to avoid collisions in the shared multi-user database.

## Scope

- **Per-canvas**: Each export/import operates on a single canvas.
- **Backend-driven**: The backend assembles the zip on export and processes it on import. The frontend only triggers downloads and uploads.
- **No destructive overwrite**: Import always creates a new canvas — it never replaces or merges into an existing one.

## Export Format

A `.zip` file with this structure:

```
manifest.json
data.json
photos/
  {original-uuid}.{ext}
  ...
```

### `manifest.json`

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-02-10T12:00:00.000Z",
  "canvasName": "My Campaign"
}
```

`schemaVersion` enables future migration. If the schema changes, bump the version and add a migration function that transforms v(N-1) data into v(N) format.

### `data.json`

Contains all canvas-scoped data using the original UUIDs as exported:

```json
{
  "canvas": { "id": "...", "name": "..." },
  "canvasItems": [...],
  "people": [...],
  "places": [...],
  "things": [...],
  "sessions": [...],
  "events": [...],
  "notes": [...],
  "photos": [...],
  "tags": [...],
  "canvasItemTags": [...],
  "canvasItemLinks": [...]
}
```

Photo rows reference files by their `filename` field which matches the file in `photos/`.

### Tables included

All canvas-scoped tables:

| Table | Key relationships |
|-------|-------------------|
| `canvases` | Root record |
| `canvas_items` | `canvasId` → canvas, `contentId` → content table |
| `people`, `places`, `things`, `sessions`, `events` | `id` referenced by `canvas_items.contentId` |
| `notes` | `canvasItemId` → canvas_items |
| `photos` | `contentType` + `contentId` → content table |
| `tags` | `canvasId` → canvas |
| `canvas_item_tags` | `canvasItemId` + `tagId` |
| `canvas_item_links` | `sourceItemId` + `targetItemId` |

**Not included**: `users`, `canvas_users` (the importing user becomes the owner).

## Import: UUID Remapping

On import, every UUID is replaced with a fresh one to avoid primary key collisions. The backend builds an `oldId → newId` map and applies it to all foreign key references.

### Remapping order

1. Generate new canvas ID
2. Generate new content IDs (people, places, things, sessions, events)
3. Generate new canvas item IDs (remap `canvasId`, `contentId`)
4. Generate new note IDs (remap `canvasItemId`)
5. Generate new photo IDs (remap `contentId`, rename file on disk)
6. Generate new tag IDs (remap `canvasId`)
7. Remap `canvasItemTags` (both `canvasItemId` and `tagId`)
8. Remap `canvasItemLinks` (both `sourceItemId` and `targetItemId`)

### Transaction safety

The entire import is wrapped in a database transaction. If any step fails, the transaction rolls back and any written photo files are cleaned up.

## Schema Versioning

The `schemaVersion` field in `manifest.json` allows forward compatibility:

- Current version: `1`
- On import, if `schemaVersion < CURRENT_VERSION`, run migration functions in sequence: `migrateV1toV2(data)`, `migrateV2toV3(data)`, etc.
- Each migration function transforms `data.json` content from one version to the next.
- If `schemaVersion > CURRENT_VERSION`, reject the import with an error.

## API Endpoints

### Export

`GET /api/canvases/:canvasId/export`

- Auth: user must own canvas
- Response: `application/zip` stream with `Content-Disposition: attachment; filename="canvas-name.zip"`

### Import

`POST /api/canvases/import`

- Auth: authenticated user
- Body: `multipart/form-data` with a single `file` field containing the `.zip`
- Response: `{ id, name }` of the newly created canvas
- Max file size: 100MB (configurable)

## Frontend

### Settings Sidebar

Add a "Data" section to `SettingsSidebar.tsx` (between Manage Tags and Feedback) with:

- **Export Canvas** button — triggers download of the export zip
- **Import Canvas** button — opens file picker, uploads zip, shows progress/result

### State updates

After successful import, invalidate the canvas list query so the new canvas appears in the sidebar/selector.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid zip structure | 400 with descriptive error |
| Missing manifest.json | 400: "Invalid backup file" |
| Schema version too new | 400: "Backup was created with a newer version" |
| Corrupt/missing photo files | Import succeeds, missing photos logged as warnings |
| Database insert failure | Transaction rollback, cleanup temp files, 500 |
| File too large | 413: "File too large" (multer limit) |
