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
        "&:hover": { bgcolor: "var(--color-surface0)", color: "var(--color-text)" },
      }}
    >
      <SearchIcon />
    </IconButton>
  );
}
