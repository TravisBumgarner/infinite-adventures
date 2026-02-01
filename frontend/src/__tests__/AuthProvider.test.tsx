// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/service.js", () => ({
  getUser: vi.fn(),
}));

import { getUser } from "../auth/service.js";
import { useAppStore } from "../stores/appStore";

const mockGetUser = vi.mocked(getUser);

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({ user: null, authLoading: true, toastMessage: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("appStore auth", () => {
  it("starts in loading state with no user", () => {
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.authLoading).toBe(true);
  });

  it("refreshUser resolves to user on success", async () => {
    mockGetUser.mockResolvedValue({
      success: true,
      data: { id: "u1", email: "gandalf@middle.earth" },
    });

    await useAppStore.getState().refreshUser();

    const state = useAppStore.getState();
    expect(state.user).toEqual({ id: "u1", email: "gandalf@middle.earth" });
    expect(state.authLoading).toBe(false);
  });

  it("refreshUser resolves to null on failure", async () => {
    mockGetUser.mockResolvedValue({ success: false, error: "Not authenticated" });

    await useAppStore.getState().refreshUser();

    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.authLoading).toBe(false);
  });

  it("refreshUser re-fetches the current user", async () => {
    mockGetUser
      .mockResolvedValueOnce({ success: false, error: "Not authenticated" })
      .mockResolvedValueOnce({
        success: true,
        data: { id: "u1", email: "frodo@shire.me" },
      });

    await useAppStore.getState().refreshUser();
    expect(useAppStore.getState().user).toBeNull();

    await useAppStore.getState().refreshUser();
    expect(useAppStore.getState().user).toEqual({ id: "u1", email: "frodo@shire.me" });
  });

  it("clearUser sets user to null", async () => {
    mockGetUser.mockResolvedValue({
      success: true,
      data: { id: "u1", email: "gandalf@middle.earth" },
    });

    await useAppStore.getState().refreshUser();
    expect(useAppStore.getState().user).not.toBeNull();

    useAppStore.getState().clearUser();
    expect(useAppStore.getState().user).toBeNull();
  });
});
