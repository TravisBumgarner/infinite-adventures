# Frontend Standardization Audit

## Goal
Replace all hard-coded `sx` values (font sizes, spacing, colors, layout patterns) with design tokens from `styleConsts.ts` and MUI theme overrides in `Theme.tsx`. Minimize custom `sx` by pushing repeated patterns into MUI component style overrides.

## Current State
- `SPACING`, `FONT_SIZES`, `BORDER_RADIUS` exist in `styleConsts.ts` but are **never used** in components
- 49 of 74 `.tsx` files use inline `sx` props with hard-coded values
- 218+ `sx={{...}}` instances with hard-coded spacing, font sizes, and colors
- Multiple repeated patterns (nav buttons, flex containers, section labels) duplicated across files

## Design Tokens (already defined in styleConsts.ts)

### SPACING
| Token | Value | MUI equivalent (8px base) |
|-------|-------|--------------------------|
| xs | 4px | 0.5 |
| sm | 8px | 1 |
| md | 16px | 2 |
| lg | 24px | 3 |
| xl | 32px | 4 |

### FONT_SIZES
| Token | Value | Approximation rules |
|-------|-------|-------------------|
| xs | 11px | 10-11px |
| sm | 13px | 12-13px |
| md | 14px | 14-15px |
| lg | 16px | 16-18px |
| xl | 20px | 19-20px+ |

### BORDER_RADIUS
| Token | Value |
|-------|-------|
| none | 0 |
| sm | 4px |
| md | 8px |
| lg | 12px |

## Approach

### 1. Theme.tsx — MUI component style overrides
Push all repeated component styling into `createTheme()` so components render correctly without `sx`:
- **Typography variants**: Configure `h1`-`h6`, `body1`, `body2`, `caption`, `subtitle2` with correct font sizes, weights, colors
- **Button**: Already has `textTransform: none`, add default sizing
- **Tab/Tabs**: Standard styling (textTransform, minWidth, minHeight, padding)
- **TextField**: Standard sizing
- **Drawer**: Standard paper styling
- **IconButton**: Standard color defaults
- **List/ListItemButton**: Standard padding, hover colors
- **Dialog/DialogTitle/DialogContent**: Standard padding

### 2. Replace hard-coded values with tokens
- All `fontSize: 13` → `FONT_SIZES.sm`
- All `fontSize: 14` → `FONT_SIZES.md`
- All `p: 2` → `SPACING.md` (when raw px needed) or keep MUI number (when theme spacing works)
- All `gap: 0.5` → keep as MUI spacing multiplier (already standardized)

### 3. Eliminate duplicate sx patterns
Patterns that appear 3+ times become theme overrides rather than shared sx objects.

## Files by priority (most sx to clean up)

1. **CanvasItemPanel.tsx** (867 lines) — heaviest sx usage
2. **SessionDetail.tsx** (639 lines)
3. **MentionEditor.tsx** (640 lines)
4. **QuickNotes.tsx** (438 lines)
5. **Marketing.tsx** (452 lines)
6. **SearchBar.tsx** (412 lines)
7. **NotesTab.tsx** (381 lines)
8. **ManageTags.tsx** (361 lines)
9. **PhotosTab.tsx** (332 lines)
10. **Gallery.tsx** (321 lines)
11. **DiceRoller.tsx** (316 lines)
12. **Timeline.tsx** (476 lines)
13. **TimelineCalendar.tsx** (249 lines)
14. Remaining 36 files with sx props
