import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { UpdateAudience } from "./update-audience";

const segments = [
  { id: "segment_beta", name: "Beta" },
  { id: "segment_paid", name: "Paid" },
];

describe("UpdateAudience", () => {
  it("adds and removes a segment, and reports the typed languages", () => {
    const onSegmentsChange = vi.fn();
    const onLanguagesChange = vi.fn();
    const view = renderComponent(
      <UpdateAudience
        segments={segments}
        segmentIds={["segment_paid"]}
        onSegmentsChange={onSegmentsChange}
        languages=""
        onLanguagesChange={onLanguagesChange}
      />,
    );
    fireEvent.click(view.getByRole("checkbox", { name: "Beta" }));
    expect(onSegmentsChange).toHaveBeenLastCalledWith([
      "segment_paid",
      "segment_beta",
    ]);
    fireEvent.click(view.getByRole("checkbox", { name: "Paid" }));
    expect(onSegmentsChange).toHaveBeenLastCalledWith([]);
    fireEvent.change(view.getByLabelText("Only these languages"), {
      target: { value: "fr, de" },
    });
    expect(onLanguagesChange).toHaveBeenCalledWith("fr, de");
  });

  it("has no segment choice in a workspace without segments", () => {
    const view = renderComponent(
      <UpdateAudience
        segments={[]}
        segmentIds={[]}
        onSegmentsChange={vi.fn()}
        languages=""
        onLanguagesChange={vi.fn()}
      />,
    );
    expect(view.queryByText("Only customers in these segments")).toBeNull();
    expect(view.getByLabelText("Only these languages")).toBeVisible();
  });
});
