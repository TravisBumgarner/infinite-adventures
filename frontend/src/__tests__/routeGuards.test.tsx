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
      <MemoryRouter initialEntries={["/canvas"]}>
        <Routes>
          <Route
            path="/canvas"
            element={
              <MemberRoute>
                <div>protected-content</div>
              </MemberRoute>
            }
          />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("protected-content")).toBeDefined();
  });

  it("redirects to / when user is not authenticated", () => {
    useAppStore.setState({
      user: null,
      authLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/canvas"]}>
        <Routes>
          <Route
            path="/canvas"
            element={
              <MemberRoute>
                <div>protected-content</div>
              </MemberRoute>
            }
          />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("home-page")).toBeDefined();
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
          <Route path="/canvas" element={<div>canvas-page</div>} />
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

  it("redirects to /canvas when user is authenticated", () => {
    useAppStore.setState({
      user: { id: "u1", email: "gandalf@middle.earth" },
      authLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/canvas" element={<div>canvas-page</div>} />
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

    expect(screen.getByText("canvas-page")).toBeDefined();
  });
});
