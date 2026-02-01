import { useCallback, useRef, useState } from "react";

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

export function useAutoSave({
  saveFn,
  delay = 800,
  savedDuration = 2000,
}: UseAutoSaveOptions): UseAutoSaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

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
