import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Mention from "@tiptap/extension-mention";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CanvasItem, CanvasItemType } from "shared";
import { contentToHtml, serializeToMentionText } from "../../../utils/editorSerializer";
import { getContrastText } from "../../../utils/getContrastText";

interface MentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  itemsCache: Map<string, CanvasItem>;
  canvasId: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  onCreate?: (title: string) => Promise<{ id: string; title: string } | null>;
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
            <Chip
              label={item.type.toUpperCase()}
              size="small"
              sx={{
                bgcolor: bgColor,
                color: getContrastText(bgColor),
                fontSize: 10,
                fontWeight: 600,
                height: 18,
              }}
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
        setSelectedIndex((i) => (i + 1) % Math.max(totalItems, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
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
      setSelectedIndex(0);
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

function FormattingToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
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
          borderRadius: 1,
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
          borderRadius: 1,
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
          borderRadius: 1,
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
          borderRadius: 1,
          fontSize: 13,
          fontWeight: 700,
          color: editor.isActive("orderedList") ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: editor.isActive("orderedList") ? "var(--color-surface1)" : "transparent",
        }}
      >
        1.
      </IconButton>
    </Box>
  );
}

export default function MentionEditor({
  value,
  onChange,
  itemsCache,
  canvasId: _canvasId,
  style,
  containerStyle,
  onCreate,
}: MentionEditorProps) {
  const theme = useTheme();
  const [suggestionPopup, setSuggestionPopup] = useState<React.ReactNode | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState<SuggestionPosition | null>(null);
  const suggestionRef = useRef<SuggestionComponentRef>(null);
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

  return (
    <Box sx={{ position: "relative", display: "flex", flexDirection: "column", ...containerStyle }}>
      <FormattingToolbar editor={editor} />
      <div style={{ ...style, flex: 1 }} className="mention-editor-wrapper">
        <EditorContent editor={editor} />
      </div>
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
