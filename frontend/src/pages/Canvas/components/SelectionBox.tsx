import { useOnSelectionChange, useStoreApi } from "@xyflow/react";
import { useCallback } from "react";

/**
 * Activates React Flow's built-in draggable selection wrapper whenever
 * 2+ nodes are selected, regardless of selection method (rubber-band or Cmd+click).
 */
export default function SelectionSync() {
  const storeApi = useStoreApi();

  useOnSelectionChange({
    onChange: useCallback(
      ({ nodes }) => {
        storeApi.setState({ nodesSelectionActive: nodes.length >= 2 });
      },
      [storeApi],
    ),
  });

  return null;
}
