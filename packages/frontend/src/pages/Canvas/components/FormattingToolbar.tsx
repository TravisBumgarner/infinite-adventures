import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import type { useEditor } from "@tiptap/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { FONT_SIZES } from "../../../styles/styleConsts";

export interface FormattingToolbarRef {
  openLinkDialogWithUrl: (url: string) => void;
}

const FormattingToolbar = forwardRef<
  FormattingToolbarRef,
  { editor: ReturnType<typeof useEditor> }
>(function FormattingToolbar({ editor }, ref) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  useImperativeHandle(ref, () => ({
    openLinkDialogWithUrl(url: string) {
      setLinkUrl(url);
      setLinkLabel("");
      setLinkDialogOpen(true);
    },
  }));

  if (!editor) return null;

  function openLinkDialog() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const { from, to } = editor.state.selection;
    const selectedText = from !== to ? editor.state.doc.textBetween(from, to) : "";
    setLinkLabel(selectedText);
    setLinkUrl("");
    setLinkDialogOpen(true);
  }

  function handleLinkSave() {
    if (!editor || !linkUrl.trim()) return;
    const href = linkUrl.trim();
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().setLink({ href }).run();
    } else {
      const label = linkLabel.trim() || href;
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: label,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    }
    setLinkDialogOpen(false);
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 0.25,
          p: 0.5,
          bgcolor: "var(--color-base)",
          border: "1px solid var(--color-surface1)",
          borderBottom: "none",
        }}
      >
        <IconButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          title="Bold"
          sx={{
            fontSize: FONT_SIZES.sm,
            fontWeight: 700,
            color: editor.isActive("bold") ? "var(--color-text)" : "var(--color-subtext0)",
            bgcolor: editor.isActive("bold") ? "var(--color-surface1)" : "transparent",
          }}
        >
          B
        </IconButton>
        <IconButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          title="Italic"
          sx={{
            fontSize: FONT_SIZES.sm,
            fontWeight: 700,
            fontStyle: "italic",
            color: editor.isActive("italic") ? "var(--color-text)" : "var(--color-subtext0)",
            bgcolor: editor.isActive("italic") ? "var(--color-surface1)" : "transparent",
          }}
        >
          I
        </IconButton>
        <IconButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          title="Bullet List"
          sx={{
            fontSize: FONT_SIZES.sm,
            fontWeight: 700,
            color: editor.isActive("bulletList") ? "var(--color-text)" : "var(--color-subtext0)",
            bgcolor: editor.isActive("bulletList") ? "var(--color-surface1)" : "transparent",
          }}
        >
          •
        </IconButton>
        <IconButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          title="Ordered List"
          sx={{
            fontSize: FONT_SIZES.sm,
            fontWeight: 700,
            color: editor.isActive("orderedList") ? "var(--color-text)" : "var(--color-subtext0)",
            bgcolor: editor.isActive("orderedList") ? "var(--color-surface1)" : "transparent",
          }}
        >
          1.
        </IconButton>
        <IconButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleTaskList().run();
          }}
          title="Task List"
          sx={{
            fontSize: FONT_SIZES.lg,
            fontWeight: 700,
            color: editor.isActive("taskList") ? "var(--color-text)" : "var(--color-subtext0)",
            bgcolor: editor.isActive("taskList") ? "var(--color-surface1)" : "transparent",
          }}
        >
          ☑
        </IconButton>
        <IconButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            openLinkDialog();
          }}
          title={editor.isActive("link") ? "Remove Link" : "Add Link"}
          sx={{
            color: editor.isActive("link") ? "var(--color-text)" : "var(--color-subtext0)",
            bgcolor: editor.isActive("link") ? "var(--color-surface1)" : "transparent",
          }}
        >
          {editor.isActive("link") ? (
            <LinkOffIcon sx={{ fontSize: FONT_SIZES.lg }} />
          ) : (
            <LinkIcon sx={{ fontSize: FONT_SIZES.lg }} />
          )}
        </IconButton>
      </Box>
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Link</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}
        >
          <TextField
            label="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            size="small"
            fullWidth
            autoFocus
            placeholder="https://..."
          />
          <TextField
            label="Label"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            size="small"
            fullWidth
            placeholder="Display text (optional)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLinkSave} variant="contained" disabled={!linkUrl.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default FormattingToolbar;
