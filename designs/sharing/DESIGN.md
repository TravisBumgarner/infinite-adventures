# Sharing Feature Design

## Overview
Allow users to share canvases and individual canvas items via public links. Shared content is **readonly**. Recipients can optionally copy shared data into their own workspace.

## Sharing Model

### Share Scopes
- **Canvas-level**: Share an entire canvas (all items, notes, photos, tags, connections)
- **Item-level**: Share a single canvas item (its notes, photos, tags, connections)

### Access Levels
- **Nobody** (default): No sharing — only the owner can access
- **Everyone with link**: Anyone with the share URL can view (readonly, no auth required)

### Share Tokens
Each share creates a unique token (UUID). The share URL is `/shared/:token`. Tokens can be revoked (deleted), which immediately removes access.

## Data Model

### New table: `shares`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| token | text (unique, indexed) | Public share token in URLs |
| canvas_id | uuid (FK → canvases) | Always set — the canvas being shared |
| item_id | uuid (FK → canvas_items, nullable) | If set, only this item is shared |
| created_by | uuid (FK → users) | The user who created the share |
| created_at | timestamp | When the share was created |

- Canvas-level share: `item_id` is null
- Item-level share: `item_id` references a specific item

## Backend

### Per-route Auth Middleware

Instead of separate public routes, use per-route middleware:

**`optionalAuth`**: Same as `requireAuth` but doesn't reject unauthenticated requests. Populates `req.user` if a valid Bearer token is present, otherwise leaves it undefined and continues.

**`requireShareOrOwner`**: Middleware that checks access in order:
1. Check for share token in `req.query.token` or `req.headers['x-share-token']`
2. If share token found and valid → attach share to `req.share`, continue
3. If no share token → check `req.user` for canvas ownership
4. If neither → 403 Forbidden

### Share Management Routes: `/api/shares`
All require auth (owner only):
- `POST /api/shares` — Create a share `{ canvasId, itemId? }` → returns share with token
- `GET /api/shares?canvasId=X` — List shares for a canvas
- `DELETE /api/shares/:id` — Revoke (delete) a share

### Shared Content Routes: `/api/shared/:token`
- `GET /api/shared/:token` — Uses `optionalAuth` (no auth required). Returns shared content:
  - Canvas share: full canvas data (items, notes, photos, tags, connections)
  - Item share: single item with notes, photos, tags, connections
- `POST /api/shared/:token/copy` — Uses `requireAuth` (must be logged in). Copies shared data into the user's workspace as a new canvas.

### Authorization
- Creating/listing/deleting shares: must own the canvas (`userOwnsCanvas`)
- Viewing shared content: valid share token (no auth required)
- Copying shared content: valid share token AND authenticated user

### Copy to Workspace
When a logged-in user copies shared content:
- Creates a new canvas named "[Original Name] (Copy)"
- Deep-copies all items, notes, photos (re-uploads to new storage paths), tags, connections
- Uses the existing export/import infrastructure (`backupService`) — export shared canvas to zip buffer in memory, import for the requesting user

## Frontend

### Share Icon in Top Bar
Add a share icon (`ShareIcon`) next to the settings gear in `MemberLayout.tsx`'s `right` slot. Clicking it opens a Share modal/popover for the **current canvas**.

### Share Icon in Item Panel Header
Add a share icon in `PanelHeader.tsx` next to the three-dot menu. Clicking it opens a Share modal/popover for **that specific item**.

### Share Modal (new component)
- Shows the share status: "Not shared" or "Shared — anyone with link can view"
- Toggle to enable/disable sharing (creates or revokes the share)
- When shared: displays the share URL with a copy-to-clipboard button
- Link to "Manage all shares in Settings" → opens Settings sidebar to Sharing tab
- If item-level: shows item title; if canvas-level: shows canvas name

### Settings Sidebar — Tabs
Restructure `SettingsSidebar.tsx` from a flat list to tabs:

**Tab 1: General**
- Theme toggle
- Feedback form
- Community links (Discord, Release Notes)
- Restart Tour
- Logout (at bottom)

**Tab 2: Tags**
- ManageTags component (moved from current flat layout)

**Tab 3: Data**
- Backup Canvas button
- Import Canvas button

**Tab 4: Sharing**
- List all active shares for the current canvas
- Each share shows: type (Canvas/Item), item title if applicable, created date, share URL
- Copy link button per share
- Revoke button per share
- "Create new share" button

### Shared Viewer Page (`/shared/:token`)
New route, accessible without auth:
- Fetches shared content via `GET /api/shared/:token`
- Displays readonly view of the shared canvas/item
- Canvas share: shows a simplified canvas with items list, notes, photos (no editing controls)
- Item share: shows item detail with notes and photos (no editing controls)
- If user is logged in: shows "Copy to My Workspace" button
- If not logged in: shows "Sign up to copy this to your workspace" link
- Branding: minimal header with app logo
