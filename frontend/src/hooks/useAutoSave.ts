import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

// Global count of useAutoSave instances with pending changes.
// The beforeunload listener is added/removed based on this count.
let dirtyCount = 0;

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
}

function incrementDirty() {
  if (dirtyCount === 0) {
    window.addEventListener("beforeunload", onBeforeUnload);
  }
  dirtyCount++;
}

function decrementDirty() {
  dirtyCount = Math.max(0, dirtyCount - 1);
  if (dirtyCount === 0) {
    window.removeEventListener("beforeunload", onBeforeUnload);
  }
}

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

export function useAutoSave({
  saveFn,
  delay = 800,
  savedDuration = 2000,
}: UseAutoSaveOptions): UseAutoSaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const isDirtyForUnloadRef = useRef(false);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  // Clean up on unmount if this instance was dirty
  useEffect(() => {
    return () => {
      if (isDirtyForUnloadRef.current) {
        decrementDirty();
      }
    };
  }, []);

  const doSave = useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setStatus("saving");
    try {
      await saveFnRef.current();
      if (isDirtyForUnloadRef.current) {
        isDirtyForUnloadRef.current = false;
        decrementDirty();
      }
      setStatus("saved");
      savedTimerRef.current = setTimeout(() => {
        setStatus("idle");
      }, savedDuration);
    } catch {
      dirtyRef.current = true;
      setStatus("error");
    }
  }, [savedDuration]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    if (!isDirtyForUnloadRef.current) {
      isDirtyForUnloadRef.current = true;
      incrementDirty();
    }
    setStatus("unsaved");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      doSave();
    }, delay);
  }, [delay, doSave]);

  const flush = useCallback(async () => {
    await doSave();
  }, [doSave]);

  return { status, markDirty, flush };
}
