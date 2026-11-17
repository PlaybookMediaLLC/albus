import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { fill, press } from "../../../test/actions";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { FactorScoreForm } from "./factor-score-form";

const factors = [
  { id: "impact", name: "Impact", weight: 3 },
  { id: "effort", name: "Effort", weight: -1 },
];

describe("FactorScoreForm", () => {
  describeFormContract({
    render: (onSubmit) =>
      renderComponent(
        <FactorScoreForm
          factors={factors}
          values={[{ factorId: "effort", value: 4 }]}
          onSubmit={onSubmit}
        />,
      ),
    fieldName: "Impact (weight 3)",
    issuePath: "impact",
    submitName: "Save factors",
    validValue: "7",
    invalidValue: "11",
    expectedValues: { impact: 7, effort: 4 },
  });

  it("starts with the stored values and sends each factor, null when emptied", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <FactorScoreForm
        factors={factors}
        values={[{ factorId: "effort", value: 4 }]}
        onSubmit={onSubmit}
      />,
    );
    expect(view.getByLabelText("Effort (weight -1)")).toHaveValue("4");
    fill("Impact (weight 3)", "8");
    fill("Effort (weight -1)", "");
    press("Save factors");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ impact: 8, effort: null }),
    );
  });

  it("refuses a value above 10", async () => {
    const onSubmit = vi.fn(async () => undefined);
    renderComponent(
      <FactorScoreForm factors={factors} values={[]} onSubmit={onSubmit} />,
    );
    fill("Impact (weight 3)", "11");
    press("Save factors");
    await waitFor(() =>
      expect(
        document.querySelector("#team-triage-factor-impact"),
      ).toHaveAttribute("aria-invalid", "true"),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
