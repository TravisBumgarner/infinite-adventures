import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useRef, useState } from "react";
import type { CanvasItem, Tag } from "shared";
import { useAddTagToItem, useRemoveTagFromItem } from "../../../hooks/mutations";
import { TagBadge } from "../../../sharedComponents/LabelBadge";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useTagStore } from "../../../stores/tagStore";
import { FONT_SIZES } from "../../../styles/styleConsts";

interface PanelTagsSectionProps {
  item: CanvasItem;
  itemId: string;
  onItemUpdated: (item: CanvasItem) => void;
}

export default function PanelTagsSection({ item, itemId, onItemUpdated }: PanelTagsSectionProps) {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const tagsById = useTagStore((s) => s.tags);
  const allTags = useMemo(() => Object.values(tagsById), [tagsById]);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const addTagMutation = useAddTagToItem(itemId, activeCanvasId ?? "");
  const removeTagMutation = useRemoveTagFromItem(itemId, activeCanvasId ?? "");

  const assignedTagIds = useMemo(() => new Set(item.tags.map((t) => t.id)), [item.tags]);

  function handleToggleTag(tag: Tag) {
    if (assignedTagIds.has(tag.id)) {
      removeTagMutation.mutate(tag.id, {
        onSuccess: () => {
          onItemUpdated({ ...item, tags: item.tags.filter((t) => t.id !== tag.id) });
        },
      });
    } else {
      addTagMutation.mutate(tag.id, {
        onSuccess: () => {
          onItemUpdated({ ...item, tags: [...item.tags, tag] });
        },
      });
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
        <Tooltip title="Manage tags">
          <IconButton
            ref={anchorRef}
            size="small"
            onClick={() => setOpen(true)}
            sx={{
              width: 26,
              height: 26,
              border: "1px dashed var(--color-overlay0)",
              borderRadius: 0.5,
              color: "var(--color-overlay0)",
              "&:hover": {
                borderColor: "var(--color-text)",
                color: "var(--color-text)",
              },
            }}
          >
            <AddIcon sx={{ fontSize: FONT_SIZES.md }} />
          </IconButton>
        </Tooltip>
        {item.tags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onDelete={() => handleToggleTag(tag)} />
        ))}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              width: 240,
              maxHeight: 320,
              mt: 0.5,
              bgcolor: "var(--color-mantle)",
              border: "1px solid var(--color-surface1)",
            },
          },
        }}
      >
        {allTags.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "var(--color-overlay0)", mb: 1 }}>
              No tags yet
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ py: 0.5 }}>
            {allTags.map((tag) => (
              <ListItemButton key={tag.id} onClick={() => handleToggleTag(tag)} sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Checkbox
                    edge="start"
                    size="small"
                    checked={assignedTagIds.has(tag.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText>
                  <TagBadge tag={tag} />
                </ListItemText>
              </ListItemButton>
            ))}
          </List>
        )}
        <Divider />
        <ListItemButton
          onClick={() => {
            setOpen(false);
            setShowSettings(true);
          }}
          sx={{ py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddIcon sx={{ fontSize: FONT_SIZES.md, color: "var(--color-overlay0)" }} />
          </ListItemIcon>
          <ListItemText
            primary="Create new tag"
            primaryTypographyProps={{ fontSize: FONT_SIZES.sm, color: "var(--color-subtext0)" }}
          />
        </ListItemButton>
      </Popover>
    </Box>
  );
}
