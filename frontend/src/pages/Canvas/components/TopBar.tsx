import type { ReactNode } from "react";
import Box from "@mui/material/Box";

interface TopBarProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export default function TopBar(_props: TopBarProps) {
  return <Box />;
}
