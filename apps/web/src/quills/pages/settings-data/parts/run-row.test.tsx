import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { RunRow } from "./run-row";

describe("RunRow", () => {
  it("shows the file, the state, the totals and the problems of a run", () => {
    const view = renderComponent(
      <RunRow
        name="ideas.csv"
        status="failed"
        detail="0 created"
        problems={["Row 2: Unknown tag"]}
      >
        <button type="button">Retry</button>
      </RunRow>,
    );
    expect(view.getByText("ideas.csv")).toBeVisible();
    expect(view.getByText("Failed")).toBeVisible();
    expect(view.getByText("0 created")).toBeVisible();
    expect(view.getByRole("listitem")).toHaveTextContent("Row 2: Unknown tag");
    expect(view.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  it("names a run that still waits", () => {
    const view = renderComponent(<RunRow name="posts.csv" status="dry_run" />);
    expect(view.getByText("Checking")).toBeVisible();
    expect(view.queryByRole("list")).toBeNull();
  });
});
