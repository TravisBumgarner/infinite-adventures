import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Note } from "shared";
import { CANVAS_ITEM_TYPES } from "../../../constants";
import { queryKeys, useTaggedItems } from "../../../hooks/queries";
import { canvasItemTypeIcon, LabelBadge } from "../../../sharedComponents/LabelBadge";
import LinkTooltip from "../../../sharedComponents/LinkTooltip";
import { useCanvasStore } from "../../../stores/canvasStore";

export interface TaggedItemsPanelRef {
  highlightItem: (itemId: string) => void;
}

interface TaggedItemsPanelProps {
  sessionId: string;
  notes: Note[];
}

export default forwardRef<TaggedItemsPanelRef, TaggedItemsPanelProps>(function TaggedItemsPanel(
  { sessionId, notes },
  ref,
) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const taggedListRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Fetch tagged items via React Query
  const { data: taggedItems = [] } = useTaggedItems(sessionId);

  // Re-fetch tagged items when notes change (mentions may have changed)
  const prevNotesRef = useRef(notes);
  useEffect(() => {
    if (prevNotesRef.current !== notes && prevNotesRef.current.length > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.taggedItems.list(sessionId) });
    }
    prevNotesRef.current = notes;
  }, [notes, sessionId, queryClient]);

  // Clear highlight after animation
  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(null), 1500);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  useImperativeHandle(ref, () => ({
    highlightItem(itemId: string) {
      setHighlightedId(itemId);
      setEditingItemId(itemId);
      requestAnimationFrame(() => {
        const el = itemRefs.current.get(itemId);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
  }));

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderLeft: "1px solid var(--color-surface0)",
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--color-text)" }}>
          Tagged Items
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
          Items @mentioned in this session's notes
        </Typography>
      </Box>

      <Box
        ref={taggedListRef}
        sx={{ flex: 1, overflowY: "auto", p: 2, pt: 1 }}
        onClick={(e) => {
          const target = (e.target as HTMLElement).closest(".mention-link") as HTMLElement | null;
          if (target) {
            e.stopPropagation();
            const itemId = target.dataset.itemId;
            if (itemId) {
              setHighlightedId(itemId);
              setEditingItemId(itemId);
              requestAnimationFrame(() => {
                const el = itemRefs.current.get(itemId);
                el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              });
            }
          }
        }}
      >
        <LinkTooltip containerRef={taggedListRef} />
        {taggedItems.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "var(--color-overlay0)", textAlign: "center", py: 3 }}
          >
            No tagged items yet. Use @mentions in your notes to tag items.
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {taggedItems.map((tagged) => {
              const typeInfo = CANVAS_ITEM_TYPES.find((t) => t.value === tagged.type);
              const bgColor = theme.palette.canvasItemTypes[tagged.type]?.light ?? "#585b70";
              const isHighlighted = highlightedId === tagged.id;
              return (
                <Box
                  key={tagged.id}
                  ref={(el: HTMLElement | null) => {
                    if (el) itemRefs.current.set(tagged.id, el);
                    else itemRefs.current.delete(tagged.id);
                  }}
                  sx={{
                    mb: 1,
                    transition: "box-shadow 0.3s, background-color 0.3s",
                    ...(isHighlighted && {
                      boxShadow: "0 0 0 2px var(--color-blue)",
                      bgcolor: "rgba(var(--color-blue-rgb, 30 102 245), 0.08)",
                    }),
                  }}
                >
                  <ListItemButton
                    onClick={() => setEditingItemId(tagged.id)}
                    sx={{
                      borderRadius: 0,
                      border: "1px solid var(--color-surface1)",
                      bgcolor: "var(--color-base)",
                      "&:hover": { bgcolor: "var(--color-surface0)" },
                      gap: 1.5,
                      py: 1.5,
                    }}
                  >
                    {tagged.selectedPhotoUrl && (
                      <Box
                        component="img"
                        src={tagged.selectedPhotoUrl}
                        alt={tagged.title}
                        sx={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tagged.title}
                      </Typography>
                    </Box>
                    <LabelBadge
                      label={typeInfo?.label ?? tagged.type}
                      accentColor={bgColor}
                      icon={canvasItemTypeIcon(tagged.type)}
                      fontSize={10}
                      sx={{ flexShrink: 0 }}
                    />
                  </ListItemButton>
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
});
