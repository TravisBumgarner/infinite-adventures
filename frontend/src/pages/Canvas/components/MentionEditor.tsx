import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CanvasItem, CanvasItemType } from "shared";
import LinkTooltip from "../../../sharedComponents/LinkTooltip";
import { contentToHtml, serializeToMentionText } from "../../../utils/editorSerializer";
import FormattingToolbar, { type FormattingToolbarRef } from "./FormattingToolbar";
import SuggestionController, {
  type SuggestionComponentRef,
  type SuggestionItem,
  type SuggestionPosition,
} from "./MentionSuggestion";

interface MentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  itemsCache: Map<string, CanvasItem>;
  canvasId: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  onCreate?: (title: string, type: CanvasItemType) => Promise<{ id: string; title: string } | null>;
  onMentionClick?: (itemId: string) => void;
}

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
  const isMentionActiveRef = useRef(false);
  const itemsCacheRef = useRef(itemsCache);
  itemsCacheRef.current = itemsCache;

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
            return Array.from(itemsCacheRef.current.values())
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
                isMentionActiveRef.current = true;
                suggestionRef.current?.updateProps(props);
              },
              onUpdate: (props: SuggestionProps<SuggestionItem>) => {
                suggestionRef.current?.updateProps(props);
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                return suggestionRef.current?.onKeyDown(props.event) ?? false;
              },
              onExit: () => {
                isMentionActiveRef.current = false;
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
      if (isMentionActiveRef.current) return;
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
              left: Math.min(suggestionPosition.left, window.innerWidth - 320),
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
