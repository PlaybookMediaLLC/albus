import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { choose, fill, press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { noFilters } from "../triage-filter-query";
import { TriageFilters } from "./triage-filters";

const render = (over: Partial<Parameters<typeof TriageFilters>[0]> = {}) =>
  renderComponent(
    <TriageFilters
      segments={[{ id: "segment_enterprise", name: "Enterprise" }]}
      withScore
      withRevenue
      value={noFilters}
      onApply={vi.fn()}
      {...over}
    />,
  );

describe("TriageFilters", () => {
  it("applies votes, revenue in major units, score and segment", async () => {
    const onApply = vi.fn();
    render({ onApply });
    fill("Minimum votes", "2");
    fill("Minimum MRR", "1250.5");
    fill("Minimum score", "-3");
    await choose("Segment", "Enterprise");
    press("Apply filters");
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        minVotes: 2,
        minMrr: 1250.5,
        minScore: -3,
        segmentId: "segment_enterprise",
      }),
    );
  });

  it("explains an amount it cannot read and applies nothing", async () => {
    const onApply = vi.fn();
    const view = render({ onApply });
    fill("Minimum MRR", "1,250");
    press("Apply filters");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Enter an amount such as 1250.50.",
    );
    fill("Minimum MRR", "10.999");
    press("Apply filters");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Enter an amount such as 1250.50.",
    );
    expect(onApply).not.toHaveBeenCalled();
  });

  it("starts with the applied filters and leaves out the score without factors", () => {
    const view = render({
      value: { ...noFilters, minMrr: 1000 },
      withScore: false,
    });
    expect(view.getByLabelText("Minimum MRR")).toHaveValue("1000");
    expect(view.queryByLabelText("Minimum score")).toBeNull();
  });
});
