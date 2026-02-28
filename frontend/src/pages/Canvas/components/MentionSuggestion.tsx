import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import type { SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPES } from "../../../constants";
import { canvasItemTypeIcon, LabelBadge } from "../../../sharedComponents/LabelBadge";
import { FONT_SIZES } from "../../../styles/styleConsts";

export interface SuggestionItem {
  id: string;
  title: string;
  type: string;
}

export interface SuggestionComponentRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
  updateProps: (props: SuggestionProps<SuggestionItem>) => void;
  dismiss: () => void;
}

export interface SuggestionPosition {
  top: number;
  left: number;
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
  onCreate?: (title: string, type: CanvasItemType) => void;
  nodeTypes: Record<CanvasItemType, { light: string; dark: string }>;
}) {
  const hasCreateOptions =
    onCreate &&
    query.length > 0 &&
    !items.some((i) => i.title.toLowerCase() === query.toLowerCase());
  const createCount = hasCreateOptions ? CANVAS_ITEM_TYPES.length : 0;
  const totalItems = items.length + createCount;

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
            sx={{ gap: 1, fontSize: FONT_SIZES.sm }}
          >
            <LabelBadge
              label={item.type.toUpperCase()}
              accentColor={bgColor}
              icon={canvasItemTypeIcon(item.type as CanvasItemType)}
              height={18}
              fontSize={FONT_SIZES.xs}
            />
            {item.title}
          </MenuItem>
        );
      })}
      {hasCreateOptions &&
        CANVAS_ITEM_TYPES.map((t, i) => {
          const bgColor = nodeTypes[t.value]?.light || "#585b70";
          return (
            <MenuItem
              key={`create-${t.value}`}
              selected={selectedIndex === items.length + i}
              onMouseDown={(e) => {
                e.preventDefault();
                onCreate(query, t.value);
              }}
              sx={{
                gap: 1,
                fontSize: FONT_SIZES.sm,
                fontStyle: "italic",
                color: "var(--color-subtext0)",
              }}
            >
              <LabelBadge
                label={t.label.toUpperCase()}
                accentColor={bgColor}
                icon={canvasItemTypeIcon(t.value)}
                height={18}
                fontSize={FONT_SIZES.xs}
              />
              Create &ldquo;{query}&rdquo;
            </MenuItem>
          );
        })}
    </Paper>
  );
}

const SuggestionController = forwardRef<
  SuggestionComponentRef,
  {
    onRender: (element: React.ReactNode | null, position: SuggestionPosition | null) => void;
    nodeTypes: Record<CanvasItemType, { light: string; dark: string }>;
    onCreate?: (
      title: string,
      type: CanvasItemType,
    ) => Promise<{ id: string; title: string } | null>;
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
    async (title: string, type: CanvasItemType) => {
      if (!onCreate) return;
      const result = await onCreate(title, type);
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

      const hasCreateOptions =
        onCreate &&
        query.length > 0 &&
        !items.some((i) => i.title.toLowerCase() === query.toLowerCase());
      const createCount = hasCreateOptions ? CANVAS_ITEM_TYPES.length : 0;
      const totalItems = items.length + createCount;

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
        } else if (hasCreateOptions) {
          const createIndex = selectedIndex - items.length;
          const type = CANVAS_ITEM_TYPES[createIndex]!.value;
          handleCreate(query, type);
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

export default SuggestionController;
