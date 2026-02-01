// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoSave } from "../hooks/useAutoSave";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAutoSave", () => {
  it("starts with idle status", () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ saveFn }));
    expect(result.current.status).toBe("idle");
  });

  it("transitions to unsaved when markDirty is called", () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ saveFn }));
    act(() => result.current.markDirty());
    expect(result.current.status).toBe("unsaved");
  });

  it("auto-saves after the debounce delay", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ saveFn, delay: 800 }));

    act(() => result.current.markDirty());
    expect(saveFn).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  it("shows saving status during save", async () => {
    let resolveSave: () => void;
    const saveFn = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const { result } = renderHook(() => useAutoSave({ saveFn, delay: 100 }));

    act(() => result.current.markDirty());
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe("saving");

    await act(async () => {
      resolveSave?.();
    });

    expect(result.current.status).toBe("saved");
  });

  it("returns to idle after savedDuration", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ saveFn, delay: 100, savedDuration: 2000 }));

    act(() => result.current.markDirty());
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe("saved");

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("idle");
  });

  it("resets debounce timer on repeated markDirty calls", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ saveFn, delay: 800 }));

    act(() => result.current.markDirty());
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    act(() => result.current.markDirty());
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(saveFn).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  it("sets error status when save fails", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAutoSave({ saveFn, delay: 100 }));

    act(() => result.current.markDirty());
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe("error");
  });

  it("flush saves immediately without waiting for debounce", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ saveFn, delay: 800 }));

    act(() => result.current.markDirty());

    await act(async () => {
      await result.current.flush();
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  it("flush is a no-op when there are no pending changes", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ saveFn }));

    await act(async () => {
      await result.current.flush();
    });

    expect(saveFn).not.toHaveBeenCalled();
  });
});
