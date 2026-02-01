import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import type { Note, NoteSummary } from "../types";
import * as api from "../api/client";
import { TYPE_COLORS } from "../constants";

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

// Serialize TipTap JSON to plain text with @{id} mentions
function serializeToMentionText(json: Record<string, unknown>): string {
  const doc = json as { type: string; content?: Array<Record<string, unknown>> };
  if (!doc.content) return "";

  const lines: string[] = [];
  for (const block of doc.content) {
    if (block.type === "paragraph") {
      const content = block.content as Array<Record<string, unknown>> | undefined;
      if (!content) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const node of content) {
        if (node.type === "mention") {
          const attrs = node.attrs as { id: string; label?: string };
          line += `@{${attrs.id}}`;
        } else if (node.type === "text") {
          line += node.text as string;
        }
      }
      lines.push(line);
    }
  }
  return lines.join("\n");
}

// Parse plain text content with @{id} / @[Title] / @Title into TipTap HTML
function contentToHtml(content: string, notesCache: Map<string, Note>): string {
  if (!content) return "<p></p>";

  // Build a title->id lookup for legacy mentions
  const titleToId = new Map<string, string>();
  for (const [id, note] of notesCache) {
    titleToId.set(note.title.toLowerCase(), id);
  }

  const lines = content.split("\n");
  const paragraphs = lines.map((line) => {
    // Match @{id}, @[Title], or @Word
    const regex = /@\{([^}]+)\}|@\[([^\]]+)\]|@([\w-]+)/g;
    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Add text before the match
      result += escapeHtml(line.slice(lastIndex, match.index));

      if (match[1]) {
        // @{id} format
        const id = match[1];
        const note = notesCache.get(id);
        const label = note ? note.title : id;
        result += `<span data-type="mention" data-id="${escapeAttr(id)}" data-label="${escapeAttr(label)}">@${escapeHtml(label)}</span>`;
      } else {
        // Legacy @[Title] or @Title format
        const title = (match[2] ?? match[3])!;
        const id = titleToId.get(title.toLowerCase());
        if (id) {
          result += `<span data-type="mention" data-id="${escapeAttr(id)}" data-label="${escapeAttr(title)}">@${escapeHtml(title)}</span>`;
        } else {
          // No matching note found, render as plain text
          result += escapeHtml(match[0]);
        }
      }
      lastIndex = match.index + match[0].length;
    }

    result += escapeHtml(line.slice(lastIndex));
    return `<p>${result || "<br>"}</p>`;
  });

  return paragraphs.join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/&/g, "&amp;");
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
        // Disable features we don't need for a simple text editor
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
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
