import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CanvasItem, CanvasItemType } from "shared";
import { canvasItemTypeIcon, LabelBadge } from "../../../sharedComponents/LabelBadge";
import LinkTooltip from "../../../sharedComponents/LinkTooltip";
import { contentToHtml, serializeToMentionText } from "../../../utils/editorSerializer";

interface MentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  itemsCache: Map<string, CanvasItem>;
  canvasId: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  onCreate?: (title: string) => Promise<{ id: string; title: string } | null>;
  onMentionClick?: (itemId: string) => void;
}

interface SuggestionItem {
  id: string;
  title: string;
  type: string;
}

function SuggestionPopup({
  items,
  query,
  selectedIndex,
  onSelect,
  onCreate,
  nodeTypes,
}: {
  items: SuggestionItem[];
  query: string;
  selectedIndex: number;
  onSelect: (item: SuggestionItem) => void;
  onCreate?: (title: string) => void;
  nodeTypes: Record<CanvasItemType, { light: string; dark: string }>;
}) {
  const hasCreateOption =
    query.length > 0 && !items.some((i) => i.title.toLowerCase() === query.toLowerCase());
  const totalItems = items.length + (hasCreateOption ? 1 : 0);

  if (totalItems === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        maxHeight: 200,
        overflowY: "auto",
        bgcolor: "var(--color-surface0)",
        border: "1px solid var(--color-surface1)",
      }}
    >
      {items.map((item, i) => {
        const bgColor = nodeTypes[item.type as CanvasItemType]?.light || "#585b70";
        return (
          <MenuItem
            key={item.id}
            selected={i === selectedIndex}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            sx={{ gap: 1, fontSize: 13 }}
          >
            <LabelBadge
              label={item.type.toUpperCase()}
              accentColor={bgColor}
              icon={canvasItemTypeIcon(item.type as CanvasItemType)}
              height={18}
              fontSize={10}
            />
            {item.title}
          </MenuItem>
        );
      })}
      {hasCreateOption && onCreate && (
        <MenuItem
          selected={selectedIndex === items.length}
          onMouseDown={(e) => {
            e.preventDefault();
            onCreate(query);
          }}
          sx={{
            fontStyle: "italic",
            color: "var(--color-subtext0)",
            fontSize: 13,
          }}
        >
          Create &ldquo;{query}&rdquo;
        </MenuItem>
      )}
    </Paper>
  );
}

interface SuggestionComponentRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
  updateProps: (props: SuggestionProps<SuggestionItem>) => void;
  dismiss: () => void;
}

interface SuggestionPosition {
  top: number;
  left: number;
}

const SuggestionController = forwardRef<
  SuggestionComponentRef,
  {
    onRender: (element: React.ReactNode | null, position: SuggestionPosition | null) => void;
    nodeTypes: Record<CanvasItemType, { light: string; dark: string }>;
    onCreate?: (title: string) => Promise<{ id: string; title: string } | null>;
  }
>(({ onRender, nodeTypes, onCreate }, ref) => {
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<SuggestionPosition | null>(null);
  const [isActive, setIsActive] = useState(false);
  const commandRef = useRef<((props: { id: string; label: string }) => void) | null>(null);

  const dismiss = useCallback(() => {
    setIsActive(false);
    onRender(null, null);
  }, [onRender]);

  const handleCreate = useCallback(
    async (title: string) => {
      if (!onCreate) return;
      const result = await onCreate(title);
      if (result) {
        commandRef.current?.({ id: result.id, label: result.title });
      }
      dismiss();
    },
    [onCreate, dismiss],
  );

  const handleSelect = useCallback(
    (item: SuggestionItem) => {
      commandRef.current?.({ id: item.id, label: item.title });
      dismiss();
    },
    [dismiss],
  );

  useImperativeHandle(ref, () => ({
    onKeyDown(event: KeyboardEvent): boolean {
      if (!isActive) return false;

      const hasCreateOption =
        onCreate &&
        query.length > 0 &&
        !items.some((i) => i.title.toLowerCase() === query.toLowerCase());
      const totalItems = items.length + (hasCreateOption ? 1 : 0);

      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i < 0 ? 0 : (i + 1) % Math.max(totalItems, 1)));
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) =>
          i < 0
            ? Math.max(totalItems, 1) - 1
            : (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1),
        );
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        if (selectedIndex < 0) return false;
        if (selectedIndex < items.length) {
          const item = items[selectedIndex]!;
          handleSelect(item);
        } else if (hasCreateOption) {
          handleCreate(query);
        }
        return true;
      }
      if (event.key === "Escape") {
        dismiss();
        return true;
      }
      return false;
    },
    updateProps(props: SuggestionProps<SuggestionItem>) {
      setItems(props.items);
      setQuery(props.query);
      setSelectedIndex(props.items.length > 0 ? 0 : -1);
      setIsActive(true);
      commandRef.current = props.command as unknown as (p: { id: string; label: string }) => void;
      // Get cursor position from clientRect
      const rect = props.clientRect?.();
      if (rect) {
        setPosition({ top: rect.top, left: rect.left });
      }
    },
    dismiss() {
      dismiss();
    },
  }));

  useEffect(() => {
    if (!isActive) return;

    onRender(
      <SuggestionPopup
        items={items}
        query={query}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        onCreate={onCreate ? handleCreate : undefined}
        nodeTypes={nodeTypes}
      />,
      position,
    );
  }, [
    items,
    query,
    selectedIndex,
    onRender,
    nodeTypes,
    onCreate,
    handleSelect,
    handleCreate,
    position,
    isActive,
  ]);

  return null;
});

SuggestionController.displayName = "SuggestionController";

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
            fontSize: 13,
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
            fontSize: 13,
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
            fontSize: 13,
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
            fontSize: 13,
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
            fontSize: 17,
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
            <LinkOffIcon sx={{ fontSize: 16 }} />
          ) : (
            <LinkIcon sx={{ fontSize: 16 }} />
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

export default function MentionEditor({
  value,
  onChange,
  itemsCache,
  canvasId: _canvasId,
  style,
  containerStyle,
  onCreate,
  onMentionClick,
}: MentionEditorProps) {
  const theme = useTheme();
  const [suggestionPopup, setSuggestionPopup] = useState<React.ReactNode | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState<SuggestionPosition | null>(null);
  const suggestionRef = useRef<SuggestionComponentRef>(null);
  const toolbarRef = useRef<FormattingToolbarRef>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  const handleRender = useCallback(
    (element: React.ReactNode | null, position: SuggestionPosition | null) => {
      setSuggestionPopup(element);
      setSuggestionPosition(position);
    },
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        linkOnPaste: true,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            // Use the cached items instead of fetching from API
            return Array.from(itemsCache.values())
              .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
              .map((item) => ({
                id: item.id,
                title: item.title,
                type: item.type,
              }));
          },
          render: () => {
            return {
              onStart: (props: SuggestionProps<SuggestionItem>) => {
                suggestionRef.current?.updateProps(props);
              },
              onUpdate: (props: SuggestionProps<SuggestionItem>) => {
                suggestionRef.current?.updateProps(props);
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                return suggestionRef.current?.onKeyDown(props.event) ?? false;
              },
              onExit: () => {
                suggestionRef.current?.dismiss();
              },
            };
          },
          command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: "mention",
                  attrs: { id: props.id, label: props.label },
                },
                { type: "text", text: " " },
              ])
              .run();
          },
        },
      }),
    ],
    content: contentToHtml(value, itemsCache),
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      const json = editor.getJSON();
      const text = serializeToMentionText(json as Record<string, unknown>);
      onChange(text);
    },
  });

  const prevValue = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      prevValue.current = value;
      return;
    }
    if (value !== prevValue.current) {
      prevValue.current = value;
      const html = contentToHtml(value, itemsCache);
      editor.commands.setContent(html);
    }
  }, [value, editor, itemsCache]);

  const handleEditLink = useCallback((url: string) => {
    toolbarRef.current?.openLinkDialogWithUrl(url);
  }, []);

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onMentionClick) return;
      const target = (e.target as HTMLElement).closest(
        "[data-type='mention']",
      ) as HTMLElement | null;
      if (target) {
        const itemId = target.dataset.id;
        if (itemId) {
          e.preventDefault();
          e.stopPropagation();
          onMentionClick(itemId);
        }
      }
    },
    [onMentionClick],
  );

  return (
    <Box sx={{ position: "relative", display: "flex", flexDirection: "column", ...containerStyle }}>
      <FormattingToolbar ref={toolbarRef} editor={editor} />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: editor wrapper delegates mention clicks */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by TipTap */}
      <div
        ref={wrapperRef}
        style={{ ...style, flex: 1 }}
        className="mention-editor-wrapper"
        onClick={handleWrapperClick}
      >
        <EditorContent editor={editor} />
      </div>
      <LinkTooltip containerRef={wrapperRef} onEdit={handleEditLink} />
      <SuggestionController
        ref={suggestionRef}
        onRender={handleRender}
        nodeTypes={theme.palette.canvasItemTypes}
        onCreate={onCreate}
      />
      {suggestionPopup &&
        suggestionPosition &&
        createPortal(
          <Box
            sx={{
              position: "fixed",
              top: suggestionPosition.top,
              left: suggestionPosition.left,
              transform: "translateY(-100%)",
              zIndex: 1300,
              mb: 0.5,
            }}
          >
            {suggestionPopup}
          </Box>,
          document.body,
        )}
    </Box>
  );
}
