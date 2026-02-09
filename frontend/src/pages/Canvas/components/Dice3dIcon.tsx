import type { SvgIconProps } from "@mui/material/SvgIcon";
import SvgIcon from "@mui/material/SvgIcon";

export default function Dice3dIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <polygon
        points="12,2 22,8 22,16 12,22 2,16 2,8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.2" />
      <line x1="2" y1="8" x2="22" y2="16" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22" y1="8" x2="2" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </SvgIcon>
  );
}
