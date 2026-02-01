import { useState, useEffect, useRef, useCallback } from "react";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  /** Function that performs the save. Should throw on failure. */
  saveFn: () => Promise<void>;
  /** Debounce delay in ms before auto-saving. Default 800. */
  delay?: number;
  /** Duration to show "Saved" before returning to idle. Default 2000. */
  savedDuration?: number;
}

interface UseAutoSaveResult {
  status: SaveStatus;
  /** Call when content changes to trigger debounced auto-save. */
  markDirty: () => void;
  /** Immediately flush any pending save. Returns when save completes. */
  flush: () => Promise<void>;
}

export function useAutoSave(_options: UseAutoSaveOptions): UseAutoSaveResult {
  return {
    status: "idle",
    markDirty: () => {},
    flush: async () => {},
  };
}
