import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { StateView } from "./state-view";
import { renderComponent } from "../test/render";
import { advanceClock, press } from "../test/actions";

describe("StateView", () => {
  afterEach(() => vi.useRealTimers());
  it("uses an alert for a problem", () => {
    const view = renderComponent(
      <StateView problem={{ kind: "failed" }}>{null}</StateView>,
    );
    expect(view.getByRole("alert")).toBeInTheDocument();
  });
  it("blocks retry until Retry-After expires without retrying automatically", async () => {
    vi.useFakeTimers();
    const retry = vi.fn();
    const view = renderComponent(
      <StateView
        problem={{ kind: "rateLimited", retryAt: Date.now() + 3000 }}
        onRetry={retry}
      >
        {null}
      </StateView>,
    );
    expect(view.getByRole("button")).toBeDisabled();
    press(/try again/i);
    expect(retry).not.toHaveBeenCalled();
    await advanceClock(3000);
    expect(view.getByRole("button", { name: "Try again" })).not.toBeDisabled();
    expect(retry).not.toHaveBeenCalled();
    press("Try again");
    expect(retry).toHaveBeenCalledOnce();
  });
  it("offers a user-controlled retry after a network failure", () => {
    const retry = vi.fn();
    renderComponent(
      <StateView problem={{ kind: "failed" }} onRetry={retry}>
        {null}
      </StateView>,
    );
    press("Try again");
    expect(retry).toHaveBeenCalledOnce();
  });

  it("shows a delayed skeleton, not a spinner, and placeholder rows for a list", () => {
    const page = renderComponent(<StateView loading>{null}</StateView>);
    const placeholder = page.getByRole("status");
    expect(placeholder).toHaveClass("delayed-reveal");
    expect(placeholder.querySelector("[data-slot=skeleton]")).not.toBeNull();
    expect(placeholder.querySelector(".animate-spin")).toBeNull();
    expect(placeholder).toHaveTextContent("Loading…");
    page.unmount();
    const rows = renderComponent(
      <StateView loading rows={3}>
        {null}
      </StateView>,
    );
    const status = rows.getByRole("status");
    expect(status.querySelectorAll("[data-slot=skeleton]")).toHaveLength(3);
    expect(status).toHaveTextContent("Loading…");
  });

  it("shows the empty icon and line", () => {
    const view = renderComponent(
      <StateView
        empty
        emptyIcon={<svg aria-hidden="true" data-icon="empty" />}
        emptyDescription="Submit the first one."
      >
        {null}
      </StateView>,
    );
    expect(view.getByText("Submit the first one.")).toBeVisible();
    expect(view.container.querySelector("[data-icon=empty]")).not.toBeNull();
  });

  it("shows a full empty state in place of the line", () => {
    const view = renderComponent(
      <StateView empty emptyState={<p>Nothing yet</p>}>
        {null}
      </StateView>,
    );
    expect(view.getByText("Nothing yet")).toBeVisible();
    expect(view.queryByText("Nothing is here yet.")).toBeNull();
  });
});
