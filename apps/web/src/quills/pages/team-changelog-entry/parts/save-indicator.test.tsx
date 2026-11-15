import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { SaveIndicator } from "./save-indicator";

describe("SaveIndicator", () => {
  it("says saved and saving, and retries a failed save", () => {
    const onRetry = vi.fn();
    const view = renderComponent(
      <SaveIndicator state="saved" onRetry={onRetry} />,
    );
    expect(view.getByText("Saved")).toBeInTheDocument();
    view.rerender(<SaveIndicator state="saving" onRetry={onRetry} />);
    expect(view.getByText("Saving…")).toBeInTheDocument();
    view.rerender(<SaveIndicator state="failed" onRetry={onRetry} />);
    fireEvent.click(
      view.getByRole("button", { name: "Not saved. Try again." }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("announces a failure and names what an unsaved entry needs", () => {
    const view = renderComponent(
      <SaveIndicator state="failed" onRetry={() => undefined} />,
    );
    expect(view.getByRole("status")).toHaveTextContent("Not saved. Try again.");
    view.rerender(
      <SaveIndicator
        state="unsaved"
        missing="title"
        onRetry={() => undefined}
      />,
    );
    expect(view.getByRole("status")).toHaveTextContent(
      "Not saved yet. Add a title.",
    );
    view.rerender(
      <SaveIndicator
        state="unsaved"
        missing="content"
        onRetry={() => undefined}
      />,
    );
    expect(view.getByRole("status")).toHaveTextContent(
      "Not saved yet. Add text to the body.",
    );
    view.rerender(<SaveIndicator state="unsaved" onRetry={() => undefined} />);
    expect(view.getByRole("status")).toHaveTextContent("Not saved yet.");
    expect(view.queryByText("Saved")).toBeNull();
  });
});
