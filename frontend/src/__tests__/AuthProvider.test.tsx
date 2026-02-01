// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/service.js", () => ({
  getUser: vi.fn(),
}));

import { getUser } from "../auth/service.js";
import { AuthProvider, useAuth } from "../auth/AuthProvider";

const mockGetUser = vi.mocked(getUser);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function AuthConsumer() {
  const { user, loading } = useAuth();
  if (loading) return <div>loading</div>;
  if (user) return <div>user:{user.email}</div>;
  return <div>no-user</div>;
}

describe("AuthProvider", () => {
  it("shows loading state initially then resolves to user", async () => {
    mockGetUser.mockResolvedValue({
      success: true,
      data: { id: "u1", email: "gandalf@middle.earth" },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText("loading")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("user:gandalf@middle.earth")).toBeDefined();
    });
  });

  it("resolves to no-user when getUser fails", async () => {
    mockGetUser.mockResolvedValue({ success: false, error: "Not authenticated" });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("no-user")).toBeDefined();
    });
  });

  it("refreshUser re-fetches the current user", async () => {
    let capturedRefresh: (() => Promise<void>) | null = null;

    mockGetUser
      .mockResolvedValueOnce({ success: false, error: "Not authenticated" })
      .mockResolvedValueOnce({
        success: true,
        data: { id: "u1", email: "frodo@shire.me" },
      });

    function RefreshCapture() {
      const { refreshUser } = useAuth();
      capturedRefresh = refreshUser;
      return null;
    }

    render(
      <AuthProvider>
        <AuthConsumer />
        <RefreshCapture />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("no-user")).toBeDefined();
    });

    await act(async () => {
      await capturedRefresh!();
    });

    await waitFor(() => {
      expect(screen.getByText("user:frodo@shire.me")).toBeDefined();
    });
  });
});
