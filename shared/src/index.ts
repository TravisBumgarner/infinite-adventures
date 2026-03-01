import { z } from "zod";

// --- Canvas Item Schemas (new) ---

export const CanvasItemTypeSchema = z.enum(["person", "place", "thing", "session", "event"]);

export const CanvasItemSummarySchema = z.object({
  id: z.string(),
  type: CanvasItemTypeSchema,
  title: z.string(),
  summary: z.string(),
  canvasX: z.number(),
  canvasY: z.number(),
  selectedPhotoUrl: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  plainContent: z.string(),
  isImportant: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  originalName: z.string(),
  isMainPhoto: z.boolean(),
  isImportant: z.boolean(),
  caption: z.string(),
  aspectRatio: z.number().optional(),
  blurhash: z.string().optional(),
  cropX: z.number().optional(),
  cropY: z.number().optional(),
});

export const QuickNoteSchema = z.object({
  id: z.string(),
  canvasId: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  isImportant: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
});

export const CreateTagInputSchema = z.object({
  name: z.string(),
  icon: z.string(),
  color: z.string(),
});

export const UpdateTagInputSchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const CanvasItemLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: CanvasItemTypeSchema,
});

export const CanvasItemLinkWithSnippetSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: CanvasItemTypeSchema,
  snippet: z.string().optional(),
});

export const CanvasItemSchema = z.object({
  id: z.string(),
  type: CanvasItemTypeSchema,
  title: z.string(),
  summary: z.string(),
  canvasX: z.number(),
  canvasY: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sessionDate: z.string().optional(),
  notes: z.array(NoteSchema),
  photos: z.array(PhotoSchema),
  tags: z.array(TagSchema),
  linksTo: z.array(CanvasItemLinkSchema),
  linkedFrom: z.array(CanvasItemLinkWithSnippetSchema),
});

export const CreateCanvasItemInputSchema = z.object({
  type: CanvasItemTypeSchema,
  title: z.string(),
  canvasX: z.number().optional(),
  canvasY: z.number().optional(),
  sessionDate: z.string().optional(),
});

export const UpdateCanvasItemInputSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  canvasX: z.number().optional(),
  canvasY: z.number().optional(),
  sessionDate: z.string().optional(),
});

// --- Note Input Schemas ---

export const CreateNoteInputSchema = z.object({
  content: z.string().optional(),
  title: z.string().optional(),
});

export const UpdateNoteInputSchema = z.object({
  content: z.string().optional(),
  title: z.string().optional(),
  isImportant: z.boolean().optional(),
  snapshot: z.boolean().optional(),
});

export const ContentHistoryEntrySchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  content: z.string(),
  snapshotAt: z.string(),
});

export const UpdateQuickNoteInputSchema = z.object({
  content: z.string(),
  title: z.string().optional(),
  snapshot: z.boolean().optional(),
});

export const CanvasItemSearchResultSchema = z.object({
  itemId: z.string(),
  type: CanvasItemTypeSchema,
  title: z.string(),
  snippet: z.string(),
  noteId: z.string().nullable(),
});

export const SessionSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  sessionDate: z.string(),
  selectedPhotoUrl: z.string().optional(),
  selectedPhotoCropX: z.number().optional(),
  selectedPhotoCropY: z.number().optional(),
  selectedPhotoAspectRatio: z.number().optional(),
  createdAt: z.string(),
});

export const TaggedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: CanvasItemTypeSchema,
  selectedPhotoUrl: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
});

export const CanvasSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const CanvasSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateCanvasInputSchema = z.object({
  name: z.string(),
});

export const UpdateCanvasInputSchema = z.object({
  name: z.string().optional(),
});

export const ImportCanvasResultSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// --- Timeline ---

export const TimelineEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(["note", "photo"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  isImportant: z.boolean(),
  content: z.string().optional(),
  photoUrl: z.string().optional(),
  originalName: z.string().optional(),
  aspectRatio: z.number().optional(),
  blurhash: z.string().optional(),
  parentItemId: z.string(),
  parentItemType: CanvasItemTypeSchema,
  parentItemTitle: z.string(),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

export const PaginatedTimelineSchema = z.object({
  entries: z.array(TimelineEntrySchema),
  nextCursor: z.string().nullable(),
});

export type PaginatedTimeline = z.infer<typeof PaginatedTimelineSchema>;

export const TimelineDayCountsSchema = z.object({
  counts: z.record(z.string(), z.number()),
});

export type TimelineDayCounts = z.infer<typeof TimelineDayCountsSchema>;

// --- Gallery ---

export const GalleryEntrySchema = z.object({
  id: z.string(),
  url: z.string(),
  originalName: z.string(),
  caption: z.string(),
  aspectRatio: z.number().optional(),
  blurhash: z.string().optional(),
  isMainPhoto: z.boolean(),
  isImportant: z.boolean(),
  createdAt: z.string(),
  parentItemId: z.string(),
  parentItemType: CanvasItemTypeSchema,
  parentItemTitle: z.string(),
});

export type GalleryEntry = z.infer<typeof GalleryEntrySchema>;

export const PaginatedGallerySchema = z.object({
  entries: z.array(GalleryEntrySchema),
  nextCursor: z.string().nullable(),
});

export type PaginatedGallery = z.infer<typeof PaginatedGallerySchema>;

// --- Shares ---

export const ShareSchema = z.object({
  id: z.string(),
  token: z.string(),
  canvasId: z.string(),
  itemId: z.string().nullable(),
  itemTitle: z.string().optional(),
  itemType: CanvasItemTypeSchema.optional(),
  createdAt: z.string(),
});

export const CreateShareInputSchema = z.object({
  canvasId: z.string().uuid(),
  itemId: z.string().uuid().optional(),
});

// --- Shared Content ---

export const SharedCanvasContentSchema = z.object({
  shareType: z.literal("canvas"),
  canvasName: z.string(),
  items: z.array(CanvasItemSchema),
  tags: z.array(TagSchema),
});

export const SharedItemContentSchema = z.object({
  shareType: z.literal("item"),
  canvasName: z.string(),
  item: CanvasItemSchema,
  allItems: z.array(CanvasItemSchema),
});

export const SharedContentSchema = z.discriminatedUnion("shareType", [
  SharedCanvasContentSchema,
  SharedItemContentSchema,
]);

export type SharedContent = z.infer<typeof SharedContentSchema>;

// --- Error codes ---

export const ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_INPUT",
  "INVALID_UUID",
  "INTERNAL_ERROR",
  "NOTE_NOT_FOUND",
  "CANVAS_NOT_FOUND",
  "CANVAS_ITEM_NOT_FOUND",
  "PHOTO_NOT_FOUND",
  "TAG_NOT_FOUND",
  "LAST_CANVAS",
  "INVALID_BACKUP",
  "SHARE_NOT_FOUND",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// --- Inferred types (Canvas Items) ---

export type CanvasItemType = z.infer<typeof CanvasItemTypeSchema>;
export type CanvasItemSummary = z.infer<typeof CanvasItemSummarySchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type CanvasItemLink = z.infer<typeof CanvasItemLinkSchema>;
export type CanvasItemLinkWithSnippet = z.infer<typeof CanvasItemLinkWithSnippetSchema>;
export type CanvasItem = z.infer<typeof CanvasItemSchema>;
export type CreateCanvasItemInput = z.infer<typeof CreateCanvasItemInputSchema>;
export type UpdateCanvasItemInput = z.infer<typeof UpdateCanvasItemInputSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteInputSchema>;
export type CanvasItemSearchResult = z.infer<typeof CanvasItemSearchResultSchema>;
export type SessionSummary = z.infer<typeof SessionSummarySchema>;
export type TaggedItem = z.infer<typeof TaggedItemSchema>;
export type QuickNote = z.infer<typeof QuickNoteSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagInputSchema>;
export type ContentHistoryEntry = z.infer<typeof ContentHistoryEntrySchema>;
export type UpdateQuickNoteInput = z.infer<typeof UpdateQuickNoteInputSchema>;

// --- Inferred types (Other) ---

export type User = z.infer<typeof UserSchema>;
export type CanvasSummary = z.infer<typeof CanvasSummarySchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type CreateCanvasInput = z.infer<typeof CreateCanvasInputSchema>;
export type UpdateCanvasInput = z.infer<typeof UpdateCanvasInputSchema>;
export type ImportCanvasResult = z.infer<typeof ImportCanvasResultSchema>;
export type Share = z.infer<typeof ShareSchema>;
export type CreateShareInput = z.infer<typeof CreateShareInputSchema>;
