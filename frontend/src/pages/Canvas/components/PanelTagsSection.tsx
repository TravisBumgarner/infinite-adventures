import AddIcon from "@mui/icons-material/Add";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useMemo } from "react";
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

  const addTagMutation = useAddTagToItem(itemId, activeCanvasId ?? "");
  const removeTagMutation = useRemoveTagFromItem(itemId, activeCanvasId ?? "");

  const assignedTagIds = useMemo(() => new Set(item.tags.map((t) => t.id)), [item.tags]);
  const availableTags = useMemo(
    () => allTags.filter((t) => !assignedTagIds.has(t.id)),
    [allTags, assignedTagIds],
  );

  function handleAddTag(tag: Tag) {
    addTagMutation.mutate(tag.id, {
      onSuccess: () => {
        const updated = { ...item, tags: [...item.tags, tag] };
        onItemUpdated(updated);
      },
    });
  }

  function handleRemoveTag(tagId: string) {
    removeTagMutation.mutate(tagId, {
      onSuccess: () => {
        const updated = { ...item, tags: item.tags.filter((t) => t.id !== tagId) };
        onItemUpdated(updated);
      },
    });
  }

  return (
    <Box sx={{ px: 2, py: 1, borderBottom: "1px solid var(--color-surface0)" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
        {item.tags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onDelete={() => handleRemoveTag(tag.id)} />
        ))}
        {availableTags.length > 0 && (
          <Autocomplete
            size="small"
            options={availableTags}
            getOptionLabel={(opt) => opt.name}
            onChange={(_e, tag) => {
              if (tag) handleAddTag(tag);
            }}
            value={null}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <TagBadge tag={option} />
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Add tag"
                variant="standard"
                InputProps={{
                  ...params.InputProps,
                  disableUnderline: true,
                  startAdornment: (
                    <AddIcon sx={{ fontSize: FONT_SIZES.lg, color: "var(--color-overlay0)" }} />
                  ),
                }}
              />
            )}
            sx={{
              minWidth: 120,
              "& .MuiInputBase-root": {
                py: 0,
                fontSize: FONT_SIZES.sm,
              },
            }}
            fullWidth
            blurOnSelect
            clearOnBlur
          />
        )}
        <Box
          onClick={() => setShowSettings(true)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            height: 26,
            px: 1,
            border: "1px dashed var(--color-overlay0)",
            color: "var(--color-overlay0)",
            fontSize: FONT_SIZES.sm,
            fontWeight: 600,
            cursor: "pointer",
            "&:hover": {
              borderColor: "var(--color-text)",
              color: "var(--color-text)",
            },
          }}
        >
          <AddIcon sx={{ fontSize: FONT_SIZES.lg }} />
          New
        </Box>
      </Box>
    </Box>
  );
}
