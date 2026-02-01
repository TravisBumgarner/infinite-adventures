// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnonymousRoute, MemberRoute } from "../components/Router";
import { useAppStore } from "../stores/appStore";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MemberRoute", () => {
  it("renders children when user is authenticated", () => {
    useAppStore.setState({
      user: { id: "u1", email: "gandalf@middle.earth" },
      authLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
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
      </MemoryRouter>,
    );

    expect(screen.getByText("protected-content")).toBeDefined();
  });

  it("redirects to /login when user is not authenticated", () => {
    useAppStore.setState({
      user: null,
      authLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
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
      </MemoryRouter>,
    );

    expect(screen.getByText("login-page")).toBeDefined();
  });
});

describe("AnonymousRoute", () => {
  it("renders children when user is not authenticated", () => {
    useAppStore.setState({
      user: null,
      authLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
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
      </MemoryRouter>,
    );

    expect(screen.getByText("login-form")).toBeDefined();
  });

  it("redirects to / when user is authenticated", () => {
    useAppStore.setState({
      user: { id: "u1", email: "gandalf@middle.earth" },
      authLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
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
      </MemoryRouter>,
    );

    expect(screen.getByText("home-page")).toBeDefined();
  });
});
