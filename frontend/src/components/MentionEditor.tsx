import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import type { Note, NoteSummary } from "../types";
import * as api from "../api/client";
import { TYPE_COLORS } from "../constants";
import { serializeToMentionText, contentToHtml } from "../utils/editorSerializer";

interface MentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  notesCache: Map<string, Note>;
  style?: React.CSSProperties;
}

interface SuggestionItem {
  id: string;
  title: string;
  type: string;
}

// Suggestion popup as a React component rendered in the editor's parent
function SuggestionPopup({
  items,
  query,
  selectedIndex,
  onSelect,
}: {
  items: SuggestionItem[];
  query: string;
  selectedIndex: number;
  onSelect: (item: SuggestionItem) => void;
}) {
  const hasCreateOption = query.length > 0 && !items.some((i) => i.title.toLowerCase() === query.toLowerCase());
  const totalItems = items.length + (hasCreateOption ? 1 : 0);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div style={popupStyles.container}>
      {items.map((item, i) => (
        <div
          key={item.id}
          style={{
            ...popupStyles.item,
            background: i === selectedIndex ? "#45475a" : "transparent",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          onMouseEnter={() => {
            // handled via parent state
          }}
        >
          <span
            style={{
              ...popupStyles.badge,
              background: TYPE_COLORS[item.type as keyof typeof TYPE_COLORS] || "#585b70",
            }}
          >
            {item.type.toUpperCase()}
          </span>
          {item.title}
        </div>
      ))}
      {hasCreateOption && (
        <div
          style={{
            ...popupStyles.item,
            ...popupStyles.createItem,
            background: selectedIndex === items.length ? "#45475a" : "transparent",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect({ id: "", title: query, type: "npc" });
          }}
        >
          Create &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}

// Ref type for the suggestion component rendered via React
interface SuggestionComponentRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
  updateProps: (props: SuggestionProps<SuggestionItem>) => void;
}

const SuggestionController = forwardRef<
  SuggestionComponentRef,
  { onRender: (element: React.ReactNode | null) => void }
>(({ onRender }, ref) => {
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandRef = useRef<((props: { id: string; label: string }) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    onKeyDown(event: KeyboardEvent): boolean {
      const hasCreateOption = query.length > 0 && !items.some((i) => i.title.toLowerCase() === query.toLowerCase());
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
          commandRef.current?.({ id: item.id, label: item.title });
        } else if (hasCreateOption) {
          commandRef.current?.({ id: "", label: query });
        }
        return true;
      }
      if (event.key === "Escape") {
        onRender(null);
        return true;
      }
      return false;
    },
    updateProps(props: SuggestionProps<SuggestionItem>) {
      setItems(props.items);
      setQuery(props.query);
      setSelectedIndex(0);
      commandRef.current = props.command as unknown as (p: { id: string; label: string }) => void;
    },
  }));

  useEffect(() => {
    const hasCreateOption = query.length > 0 && !items.some((i) => i.title.toLowerCase() === query.toLowerCase());
    const totalItems = items.length + (hasCreateOption ? 1 : 0);

    onRender(
      <SuggestionPopup
        items={items}
        query={query}
        selectedIndex={selectedIndex}
        onSelect={(item) => {
          commandRef.current?.({ id: item.id, label: item.title });
        }}
      />
    );
  }, [items, query, selectedIndex, onRender]);

  return null;
});

SuggestionController.displayName = "SuggestionController";

function FormattingToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btnStyle = (active: boolean): React.CSSProperties => ({
    ...toolbarStyles.button,
    background: active ? "#45475a" : "transparent",
    color: active ? "#cdd6f4" : "#a6adc8",
  });

  return (
    <div style={toolbarStyles.bar}>
      <button
        style={btnStyle(editor.isActive("bold"))}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        title="Bold"
      >
        B
      </button>
      <button
        style={btnStyle(editor.isActive("italic"))}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        title="Italic"
      >
        I
      </button>
      <button
        style={btnStyle(editor.isActive("bulletList"))}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        title="Bullet List"
      >
        &bull;
      </button>
      <button
        style={btnStyle(editor.isActive("orderedList"))}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
        }}
        title="Ordered List"
      >
        1.
      </button>
    </div>
  );
}

export default function MentionEditor({
  value,
  onChange,
  notesCache,
  style,
}: MentionEditorProps) {
  const [suggestionPopup, setSuggestionPopup] = useState<React.ReactNode | null>(null);
  const suggestionRef = useRef<SuggestionComponentRef>(null);
  const isInternalChange = useRef(false);

  const handleRender = useCallback((element: React.ReactNode | null) => {
    setSuggestionPopup(element);
  }, []);

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
          items: async ({ query }: { query: string }) => {
            const summaries = await api.fetchNotes();
            return summaries
              .filter((n: NoteSummary) =>
                n.title.toLowerCase().includes(query.toLowerCase())
              )
              .map((n: NoteSummary) => ({
                id: n.id,
                title: n.title,
                type: n.type,
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
                setSuggestionPopup(null);
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
    content: contentToHtml(value, notesCache),
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      const json = editor.getJSON();
      const text = serializeToMentionText(json as Record<string, unknown>);
      onChange(text);
    },
  });

  // Update editor content when value changes externally (e.g., loading a new note)
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
      const html = contentToHtml(value, notesCache);
      editor.commands.setContent(html);
    }
  }, [value, editor, notesCache]);

  return (
    <div style={{ position: "relative" }}>
      <FormattingToolbar editor={editor} />
      <div style={style} className="mention-editor-wrapper">
        <EditorContent editor={editor} />
      </div>
      <SuggestionController ref={suggestionRef} onRender={handleRender} />
      {suggestionPopup && (
        <div style={popupStyles.popupWrapper}>
          {suggestionPopup}
        </div>
      )}
    </div>
  );
}

const toolbarStyles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    gap: 2,
    padding: "4px 4px",
    background: "#1e1e2e",
    border: "1px solid #45475a",
    borderBottom: "none",
    borderRadius: "6px 6px 0 0",
  },
  button: {
    border: "none",
    borderRadius: 4,
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "system-ui, sans-serif",
    lineHeight: 1,
  },
};

const popupStyles: Record<string, React.CSSProperties> = {
  popupWrapper: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    marginBottom: 4,
    zIndex: 200,
  },
  container: {
    maxHeight: 200,
    overflowY: "auto",
    background: "#313244",
    border: "1px solid #45475a",
    borderRadius: 6,
  },
  item: {
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 13,
    color: "#cdd6f4",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    fontSize: 10,
    padding: "1px 4px",
    borderRadius: 3,
    color: "#fff",
    fontWeight: 600,
  },
  createItem: {
    fontStyle: "italic",
    color: "#a6adc8",
  },
  empty: {
    padding: "8px 10px",
    fontSize: 13,
    color: "#6c7086",
  },
};
