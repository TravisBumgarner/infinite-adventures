import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import PhotoSizeSelectActualIcon from "@mui/icons-material/PhotoSizeSelectActual";
import PhotoSizeSelectActualOutlinedIcon from "@mui/icons-material/PhotoSizeSelectActualOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SortIcon from "@mui/icons-material/Sort";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import TimelineIcon from "@mui/icons-material/Timeline";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

const ACTION_ICON_MAP = {
  // Navigation
  canvas: MapIcon,
  sessions: CalendarMonthIcon,
  timeline: TimelineIcon,
  gallery: PhotoLibraryIcon,

  // Actions
  edit: EditIcon,
  pin: StarIcon,
  unpin: StarOutlineIcon,
  delete: DeleteIcon,
  add: AddIcon,
  close: CloseIcon,
  back: ArrowBackIcon,
  openExternal: OpenInNewIcon,

  // Photos
  mainPhoto: PhotoSizeSelectActualIcon,
  mainPhotoOutline: PhotoSizeSelectActualOutlinedIcon,

  // Misc
  sort: SortIcon,
  moreColumns: AddCircleOutlineIcon,
  fewerColumns: RemoveCircleOutlineIcon,
} as const satisfies Record<string, ComponentType<SvgIconProps>>;

export type IconName = keyof typeof ACTION_ICON_MAP;

export default function Icon({ name, ...props }: { name: IconName } & SvgIconProps) {
  const Component = ACTION_ICON_MAP[name];
  return <Component {...props} />;
}
