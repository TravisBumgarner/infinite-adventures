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
      sx={{
        bgcolor: "var(--color-base)",
        border: "1px solid var(--color-surface1)",
        color: "var(--color-text)",
        "&:hover": { bgcolor: "var(--color-surface0)" },
      }}
    >
      <SearchIcon />
    </IconButton>
  );
}
