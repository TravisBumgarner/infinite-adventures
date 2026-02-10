import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItem, Note } from "shared";
import { fetchItem } from "../../../api/client";
import { CANVAS_ITEM_TYPES } from "../../../constants";
import { queryKeys, useTaggedItems } from "../../../hooks/queries";
import LinkTooltip from "../../../sharedComponents/LinkTooltip";
import { useCanvasStore } from "../../../stores/canvasStore";
import { getContrastText } from "../../../utils/getContrastText";
import { getNotePreview } from "../../../utils/getNotePreview";

interface TaggedItemsPanelProps {
  sessionId: string;
  notes: Note[];
  itemsCache: Map<string, CanvasItem>;
}

export default function TaggedItemsPanel({ sessionId, notes, itemsCache }: TaggedItemsPanelProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedTaggedId, setExpandedTaggedId] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<CanvasItem | null>(null);
  const [loadingExpand, setLoadingExpand] = useState(false);
  const taggedListRef = useRef<HTMLDivElement>(null);

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

  const handleTaggedItemToggle = useCallback(
    async (itemId: string) => {
      if (expandedTaggedId === itemId) {
        setExpandedTaggedId(null);
        setExpandedItem(null);
        return;
      }
      setExpandedTaggedId(itemId);
      setExpandedItem(null);
      setLoadingExpand(true);
      try {
        const full = await queryClient.fetchQuery({
          queryKey: queryKeys.items.detail(itemId),
          queryFn: () => fetchItem(itemId),
        });
        setExpandedItem(full);
      } finally {
        setLoadingExpand(false);
      }
    },
    [expandedTaggedId, queryClient],
  );

  function handleViewOnCanvas(itemId: string) {
    navigate("/canvas");
    useCanvasStore.getState().setEditingItemId(itemId);
  }

  const notePreview = useCallback(
    (content: string) => getNotePreview(content, itemsCache),
    [itemsCache],
  );

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

      <Box ref={taggedListRef} sx={{ flex: 1, overflowY: "auto", p: 2, pt: 1 }}>
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
              const isExpanded = expandedTaggedId === tagged.id;
              return (
                <Box key={tagged.id} sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleTaggedItemToggle(tagged.id)}
                    sx={{
                      borderRadius: isExpanded ? "6px 6px 0 0" : 1.5,
                      border: "1px solid var(--color-surface1)",
                      borderBottom: isExpanded ? "none" : undefined,
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
                          borderRadius: 1,
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
                    <Chip
                      label={typeInfo?.label ?? tagged.type}
                      size="small"
                      sx={{
                        bgcolor: bgColor,
                        color: getContrastText(bgColor),
                        fontSize: 10,
                        fontWeight: 600,
                        height: 20,
                        flexShrink: 0,
                      }}
                    />
                  </ListItemButton>
                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        border: "1px solid var(--color-surface1)",
                        borderTop: "none",
                        borderRadius: "0 0 6px 6px",
                        bgcolor: "var(--color-surface0)",
                        p: 2,
                      }}
                    >
                      {loadingExpand && !expandedItem ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                          <CircularProgress size={20} />
                        </Box>
                      ) : expandedItem ? (
                        <>
                          {expandedItem.photos.find((p) => p.isMainPhoto) && (
                            <Box
                              component="img"
                              src={expandedItem.photos.find((p) => p.isMainPhoto)!.url}
                              alt={expandedItem.title}
                              sx={{
                                width: 120,
                                height: 120,
                                borderRadius: 1,
                                objectFit: "cover",
                                mb: 1.5,
                              }}
                            />
                          )}
                          {expandedItem.notes.length > 0 ? (
                            expandedItem.notes.map((note) => (
                              <Box key={note.id} sx={{ mb: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "var(--color-text)",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: notePreview(note.content),
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{ color: "var(--color-subtext0)" }}
                                >
                                  {new Date(note.updatedAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            ))
                          ) : !expandedItem.photos.find((p) => p.isMainPhoto) ? (
                            <Typography variant="body2" sx={{ color: "var(--color-overlay0)" }}>
                              No additional details
                            </Typography>
                          ) : null}
                          <Button
                            size="small"
                            startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleViewOnCanvas(tagged.id)}
                            sx={{
                              mt: 1,
                              textTransform: "none",
                              color: "var(--color-subtext0)",
                            }}
                          >
                            View on Canvas
                          </Button>
                        </>
                      ) : null}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
