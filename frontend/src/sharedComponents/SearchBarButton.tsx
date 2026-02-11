import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";

interface SearchBarButtonProps {
  onClick: () => void;
}

export default function SearchBarButton({ onClick }: SearchBarButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      title="Search (⌘K)"
      data-tour="search-button"
      size="small"
      sx={{
        color: "var(--color-subtext0)",
        "&:hover": { bgcolor: "var(--color-surface0)", color: "var(--color-text)" },
      }}
    >
      <SearchIcon />
    </IconButton>
  );
}
