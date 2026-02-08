import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useState } from "react";
import type { Tag } from "shared";
import * as api from "../api/client";
import { TagPill } from "../sharedComponents/TagPill";
import { useAppStore } from "../stores/appStore";
import { useCanvasStore } from "../stores/canvasStore";
import { useTagStore } from "../stores/tagStore";
import { getContrastText } from "../utils/getContrastText";
import { ICON_MAP, ICON_NAMES } from "../utils/iconMap";

const TAG_COLORS = [
  "#f38ba8",
  "#fab387",
  "#f9e2af",
  "#a6e3a1",
  "#94e2d5",
  "#89b4fa",
  "#cba6f7",
  "#f5c2e7",
  "#f2cdcd",
  "#b4befe",
  "#74c7ec",
  "#89dceb",
  "#eba0ac",
  "#f5e0dc",
];

interface TagFormState {
  name: string;
  icon: string;
  color: string;
}

const INITIAL_FORM: TagFormState = { name: "", icon: "Star", color: TAG_COLORS[0]! };

export function ManageTags() {
  const tags = useTagStore((s) => s.tags);
  const addTag = useTagStore((s) => s.addTag);
  const updateTagInStore = useTagStore((s) => s.updateTag);
  const removeTag = useTagStore((s) => s.removeTag);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const showToast = useAppStore((s) => s.showToast);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form, setForm] = useState<TagFormState>(INITIAL_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditingTag(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setForm({ name: tag.name, icon: tag.icon, color: tag.color });
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setEditingTag(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeCanvasId || !form.name.trim()) return;

    try {
      if (editingTag) {
        const updated = await api.updateTag(activeCanvasId, editingTag.id, {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
        });
        updateTagInStore(updated);
      } else {
        const created = await api.createTag(activeCanvasId, {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
        });
        addTag(created);
      }
      handleClose();
    } catch {
      showToast(editingTag ? "Failed to update tag" : "Failed to create tag");
    }
  }, [activeCanvasId, form, editingTag, addTag, updateTagInStore, handleClose, showToast]);

  const handleDelete = useCallback(
    async (tagId: string) => {
      if (!activeCanvasId) return;
      try {
        await api.deleteTag(activeCanvasId, tagId);
        removeTag(tagId);
        setDeleteConfirmId(null);
      } catch {
        showToast("Failed to delete tag");
      }
    },
    [activeCanvasId, removeTag, showToast],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
        Manage Tags
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {tags.map((tag) => (
          <Box
            key={tag.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.25,
            }}
          >
            <TagPill tag={tag} />
            <IconButton
              size="small"
              onClick={() => openEdit(tag)}
              sx={{ color: "var(--color-overlay0)", p: 0.25 }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setDeleteConfirmId(tag.id)}
              sx={{ color: "var(--color-overlay0)", p: 0.25 }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        <Box
          onClick={openCreate}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            height: 26,
            px: 1,
            borderRadius: "4px",
            border: "1px dashed var(--color-overlay0)",
            color: "var(--color-overlay0)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            "&:hover": {
              borderColor: "var(--color-text)",
              color: "var(--color-text)",
            },
          }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
          New
        </Box>
      </Box>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}
        >
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            size="small"
            fullWidth
            autoFocus
          />

          {/* Icon picker */}
          <Box>
            <Typography variant="caption" sx={{ color: "var(--color-subtext0)", mb: 0.5 }}>
              Icon
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {ICON_NAMES.map((name) => {
                const Icon = ICON_MAP[name]!;
                const selected = form.icon === name;
                return (
                  <IconButton
                    key={name}
                    size="small"
                    onClick={() => setForm((f) => ({ ...f, icon: name }))}
                    sx={{
                      border: selected ? "2px solid var(--color-blue)" : "2px solid transparent",
                      borderRadius: "6px",
                      color: "var(--color-text)",
                      p: 0.5,
                    }}
                  >
                    <Icon sx={{ fontSize: 20 }} />
                  </IconButton>
                );
              })}
            </Box>
          </Box>

          {/* Color picker */}
          <Box>
            <Typography variant="caption" sx={{ color: "var(--color-subtext0)", mb: 0.5 }}>
              Color
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {TAG_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: color,
                    borderRadius: "4px",
                    cursor: "pointer",
                    border:
                      form.color === color
                        ? "2px solid var(--color-text)"
                        : "2px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": { opacity: 0.8 },
                  }}
                >
                  {form.color === color && (
                    <Typography
                      sx={{ fontSize: 14, color: getContrastText(color), fontWeight: 700 }}
                    >
                      ✓
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Preview */}
          {form.name.trim() && (
            <Box>
              <Typography variant="caption" sx={{ color: "var(--color-subtext0)", mb: 0.5 }}>
                Preview
              </Typography>
              <Box>
                <TagPill
                  tag={{
                    id: "preview",
                    name: form.name.trim(),
                    icon: form.icon,
                    color: form.color,
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!form.name.trim()}>
            {editingTag ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
      >
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography>Are you sure? This will remove the tag from all items.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
