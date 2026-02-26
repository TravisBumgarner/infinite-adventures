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
import { useCallback, useMemo, useState } from "react";
import type { Tag } from "shared";
import { useCreateTag, useDeleteTag, useUpdateTag } from "../hooks/mutations";
import ConfirmDeleteDialog from "../sharedComponents/ConfirmDeleteDialog";
import { TagBadge } from "../sharedComponents/LabelBadge";
import { useCanvasStore } from "../stores/canvasStore";
import { useTagStore } from "../stores/tagStore";
import { FONT_SIZES } from "../styles/styleConsts";
import { getContrastText } from "../utils/getContrastText";
import { ICON_MAP, searchIcons } from "../utils/iconMap";

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
  const tagsById = useTagStore((s) => s.tags);
  const addTag = useTagStore((s) => s.addTag);
  const updateTagInStore = useTagStore((s) => s.updateTag);
  const removeTag = useTagStore((s) => s.removeTag);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);

  const tags = useMemo(() => Object.values(tagsById), [tagsById]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form, setForm] = useState<TagFormState>(INITIAL_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState("");

  // Mutation hooks
  const createTagMutation = useCreateTag(activeCanvasId ?? "");
  const updateTagMutation = useUpdateTag(activeCanvasId ?? "");
  const deleteTagMutation = useDeleteTag(activeCanvasId ?? "");

  const filteredIcons = useMemo(() => searchIcons(iconSearch), [iconSearch]);

  const openCreate = useCallback(() => {
    setEditingTag(null);
    setForm(INITIAL_FORM);
    setIconSearch("");
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setForm({ name: tag.name, icon: tag.icon, color: tag.color });
    setIconSearch("");
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setEditingTag(null);
  }, []);

  const isSaving = createTagMutation.isPending || updateTagMutation.isPending;

  const handleSave = useCallback(() => {
    if (!activeCanvasId || !form.name.trim() || isSaving) return;

    if (editingTag) {
      updateTagMutation.mutate(
        {
          tagId: editingTag.id,
          input: {
            name: form.name.trim(),
            icon: form.icon,
            color: form.color,
          },
        },
        {
          onSuccess: (updated) => {
            updateTagInStore(updated);
            handleClose();
          },
        },
      );
    } else {
      createTagMutation.mutate(
        {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
        },
        {
          onSuccess: (created) => {
            addTag(created);
            handleClose();
          },
        },
      );
    }
  }, [
    activeCanvasId,
    form,
    editingTag,
    isSaving,
    addTag,
    updateTagInStore,
    handleClose,
    createTagMutation,
    updateTagMutation,
  ]);

  const handleDelete = useCallback(
    (tagId: string) => {
      if (!activeCanvasId) return;
      deleteTagMutation.mutate(tagId, {
        onSuccess: () => {
          removeTag(tagId);
          setDeleteConfirmId(null);
        },
      });
    },
    [activeCanvasId, removeTag, deleteTagMutation],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
          Manage Tags
        </Typography>
        <IconButton size="small" onClick={openCreate} sx={{ color: "var(--color-text)" }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {tags.length === 0 && (
        <Typography variant="caption" sx={{ color: "var(--color-overlay0)" }}>
          No tags yet
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {tags.map((tag) => (
          <Box
            key={tag.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <TagBadge tag={tag} />
            <Box sx={{ display: "flex", gap: 0.25 }}>
              <IconButton
                size="small"
                onClick={() => openEdit(tag)}
                sx={{ color: "var(--color-overlay0)", p: 0.5 }}
              >
                <EditIcon sx={{ fontSize: FONT_SIZES.lg }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDeleteConfirmId(tag.id)}
                sx={{ color: "var(--color-overlay0)", p: 0.5 }}
              >
                <DeleteIcon sx={{ fontSize: FONT_SIZES.lg }} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
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
            <TextField
              placeholder="Search icons (e.g. sword, magic, tavern)"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(14, 1fr)",
                gap: 0.5,
                height: 180,
                overflowY: "auto",
                alignContent: "start",
              }}
            >
              {filteredIcons.map((name) => {
                const Icon = ICON_MAP[name]!;
                const selected = form.icon === name;
                return (
                  <Box
                    key={name}
                    onClick={() => setForm((f) => ({ ...f, icon: name }))}
                    title={name}
                    sx={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: selected ? "2px solid var(--color-blue)" : "2px solid transparent",
                      color: "var(--color-text)",
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 },
                    }}
                  >
                    <Icon sx={{ fontSize: FONT_SIZES.lg }} />
                  </Box>
                );
              })}
              {filteredIcons.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    gridColumn: "1 / -1",
                    py: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "var(--color-overlay0)" }}>
                    No icons match "{iconSearch}"
                  </Typography>
                  <Button size="small" onClick={() => setIconSearch("")}>
                    Clear search
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Color picker */}
          <Box>
            <Typography variant="caption" sx={{ color: "var(--color-subtext0)", mb: 0.5 }}>
              Color
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 0.5 }}>
              {TAG_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  sx={{
                    aspectRatio: "1",
                    bgcolor: color,
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
                      sx={{
                        fontSize: FONT_SIZES.md,
                        color: getContrastText(color),
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Preview */}
          <Box>
            <Typography variant="caption" sx={{ color: "var(--color-subtext0)", mb: 0.5 }}>
              Preview
            </Typography>
            <Box>
              <TagBadge
                tag={{
                  id: "preview",
                  name: form.name.trim() || "Tag Name",
                  icon: form.icon,
                  color: form.color,
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!form.name.trim() || isSaving}>
            {isSaving ? "Saving..." : editingTag ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Delete Tag"
        message="Are you sure? This will remove the tag from all items."
      />
    </Box>
  );
}
