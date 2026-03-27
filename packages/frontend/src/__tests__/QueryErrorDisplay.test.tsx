// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QueryErrorDisplay from "../sharedComponents/QueryErrorDisplay";

afterEach(() => {
  cleanup();
});

describe("QueryErrorDisplay", () => {
  it("calls onRetry when Try again is clicked", () => {
    const onRetry = vi.fn();
    render(<QueryErrorDisplay error={new Error("fail")} onRetry={onRetry} />);

    fireEvent.click(screen.getByText("Try again"));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders nothing when error is null", () => {
    const onRetry = vi.fn();
    const { container } = render(<QueryErrorDisplay error={null} onRetry={onRetry} />);

    expect(container.innerHTML).toBe("");
  });
});
