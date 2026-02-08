import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BookIcon from "@mui/icons-material/Book";
import BuildIcon from "@mui/icons-material/Build";
import CasinoIcon from "@mui/icons-material/Casino";
import DiamondIcon from "@mui/icons-material/Diamond";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FlagIcon from "@mui/icons-material/Flag";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import GroupIcon from "@mui/icons-material/Group";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import LockIcon from "@mui/icons-material/Lock";
import MapIcon from "@mui/icons-material/Map";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PetsIcon from "@mui/icons-material/Pets";
import ShieldIcon from "@mui/icons-material/Shield";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

export const ICON_MAP: Record<string, ComponentType<SvgIconProps>> = {
  Star: StarIcon,
  Favorite: FavoriteIcon,
  Flag: FlagIcon,
  Warning: WarningIcon,
  FlashOn: FlashOnIcon,
  Shield: ShieldIcon,
  Diamond: DiamondIcon,
  AutoAwesome: AutoAwesomeIcon,
  LocalFireDepartment: LocalFireDepartmentIcon,
  Visibility: VisibilityIcon,
  Lock: LockIcon,
  Pets: PetsIcon,
  MusicNote: MusicNoteIcon,
  Book: BookIcon,
  Map: MapIcon,
  Build: BuildIcon,
  Group: GroupIcon,
  Casino: CasinoIcon,
};

export const ICON_NAMES = Object.keys(ICON_MAP);
