// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/service.js", () => ({
  getUser: vi.fn(),
}));

import { AuthProvider } from "../auth/AuthProvider";
import { getUser } from "../auth/service.js";
import { AnonymousRoute, MemberRoute } from "../components/Router";

const mockGetUser = vi.mocked(getUser);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MemberRoute", () => {
  it("renders children when user is authenticated", async () => {
    mockGetUser.mockResolvedValue({
      success: true,
      data: { id: "u1", email: "gandalf@middle.earth" },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <MemberRoute>
                  <div>protected-content</div>
                </MemberRoute>
              }
            />
            <Route path="/login" element={<div>login-page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("protected-content")).toBeDefined();
    });
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ success: false, error: "Not authenticated" });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <MemberRoute>
                  <div>protected-content</div>
                </MemberRoute>
              }
            />
            <Route path="/login" element={<div>login-page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("login-page")).toBeDefined();
    });
  });
});

describe("AnonymousRoute", () => {
  it("renders children when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ success: false, error: "Not authenticated" });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<div>home-page</div>} />
            <Route
              path="/login"
              element={
                <AnonymousRoute>
                  <div>login-form</div>
                </AnonymousRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("login-form")).toBeDefined();
    });
  });

  it("redirects to / when user is authenticated", async () => {
    mockGetUser.mockResolvedValue({
      success: true,
      data: { id: "u1", email: "gandalf@middle.earth" },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<div>home-page</div>} />
            <Route
              path="/login"
              element={
                <AnonymousRoute>
                  <div>login-form</div>
                </AnonymousRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("home-page")).toBeDefined();
    });
  });
});
