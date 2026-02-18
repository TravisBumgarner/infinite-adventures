import type { CanvasItemType } from "shared";

export interface PepeNode {
  id: string;
  title: string;
  type: CanvasItemType;
}

export const PEPE_NODES: PepeNode[] = [
  { id: "pepe-silvia", title: "Pepe Silvia", type: "person" },
  { id: "pepe-carol", title: "Carol in HR", type: "person" },
  { id: "pepe-no-carol", title: "There is no Carol in HR!", type: "thing" },
  { id: "pepe-day-bow", title: "Day bow bow", type: "thing" },
  { id: "pepe-mail", title: "The mail keeps coming!", type: "thing" },
  { id: "pepe-barney", title: "Barney, give this guy a cigarette", type: "person" },
];
