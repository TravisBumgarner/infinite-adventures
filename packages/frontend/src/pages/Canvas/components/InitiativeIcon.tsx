import type { SvgIconProps } from "@mui/material/SvgIcon";
import SvgIcon from "@mui/material/SvgIcon";

export default function InitiativeIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Crossed swords */}
      <line
        x1="4"
        y1="4"
        x2="20"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="4"
        x2="4"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Sword guards */}
      <line
        x1="6"
        y1="9"
        x2="9"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="6"
        x2="18"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Pommel dots */}
      <circle cx="3.5" cy="3.5" r="1" fill="currentColor" />
      <circle cx="20.5" cy="3.5" r="1" fill="currentColor" />
    </SvgIcon>
  );
}
