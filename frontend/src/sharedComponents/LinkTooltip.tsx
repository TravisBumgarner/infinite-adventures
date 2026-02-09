import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";

interface LinkTooltipProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onEdit?: (href: string, anchor: HTMLAnchorElement) => void;
}

export default function LinkTooltip({ containerRef, onEdit }: LinkTooltipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLAnchorElement | null>(null);
  const [href, setHref] = useState("");
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popperRef = useRef<HTMLDivElement>(null);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearTimer();
    dismissTimer.current = setTimeout(() => {
      setAnchorEl(null);
      setHref("");
    }, 200);
  }, [clearTimer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function findAnchor(target: EventTarget | null): HTMLAnchorElement | null {
      let el = target as HTMLElement | null;
      while (el && el !== container) {
        if (el.tagName === "A") return el as HTMLAnchorElement;
        el = el.parentElement;
      }
      return null;
    }

    function handleMouseOver(e: MouseEvent) {
      const anchor = findAnchor(e.target);
      if (anchor) {
        clearTimer();
        setAnchorEl(anchor);
        setHref(anchor.getAttribute("href") ?? "");
      }
    }

    function handleMouseOut(e: MouseEvent) {
      const anchor = findAnchor(e.target);
      if (anchor) {
        scheduleDismiss();
      }
    }

    function handleClick(e: MouseEvent) {
      const anchor = findAnchor(e.target);
      if (anchor) {
        e.preventDefault();
      }
    }

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);
    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseout", handleMouseOut);
      container.removeEventListener("click", handleClick);
    };
  }, [containerRef, clearTimer, scheduleDismiss]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const truncatedHref = href.length > 50 ? `${href.slice(0, 50)}...` : href;

  return (
    <Popper open={!!anchorEl} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1400 }}>
      <Paper
        ref={popperRef}
        onMouseEnter={clearTimer}
        onMouseLeave={scheduleDismiss}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.5,
          bgcolor: "var(--color-surface0)",
          border: "1px solid var(--color-surface1)",
          mt: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "var(--color-subtext0)",
            maxWidth: 300,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {truncatedHref}
        </Typography>
        <IconButton
          size="small"
          title="Open link"
          onClick={() => {
            window.open(href, "_blank", "noopener,noreferrer");
            setAnchorEl(null);
          }}
          sx={{ color: "var(--color-subtext0)", p: 0.5 }}
        >
          <OpenInNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
        {onEdit && (
          <IconButton
            size="small"
            title="Edit link"
            onClick={() => {
              if (anchorEl) {
                onEdit(href, anchorEl);
              }
              setAnchorEl(null);
            }}
            sx={{ color: "var(--color-subtext0)", p: 0.5 }}
          >
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Paper>
    </Popper>
  );
}
