import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { setScoringFactorsFixture } from "../../../api/team/set-scoring-factors.fixture";
import { fill, press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { postTeam } from "../../team-post/post.fixture";
import { ScoringSection } from "./scoring-section";

const render = () =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <ScoringSection
        workspaceId="workspace_test_1"
        factors={[{ id: "impact", name: "Impact", weight: 3 }]}
      />
    </TeamRuntimeProvider>,
  );

describe("ScoringSection", () => {
  it("adds a cost factor and saves the factors, keeping the existing ID", async () => {
    const api = mockApi();
    api.reply(setScoringFactorsFixture.ok());
    const view = render();
    expect(view.getByLabelText("Factor 1 name")).toHaveValue("Impact");
    press("Add factor");
    fill("Factor 2 name", "Effort");
    // Typed one key at a time: the minus sign stays while the number is incomplete.
    const weight = view.getByLabelText("Factor 2 weight");
    fireEvent.change(weight, { target: { value: "-" } });
    expect(weight).toHaveValue("-");
    fireEvent.change(weight, { target: { value: "-2" } });
    press("Save factors");
    await waitFor(() =>
      expect(api.calls("setQuillsScoringFactors")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsScoringFactors")[0]!.json()).toEqual({
      factors: [
        { id: "impact", name: "Impact", weight: 3 },
        { name: "Effort", weight: -2 },
      ],
    });
  });

  it("refuses a weight of 0 and removes a factor", async () => {
    const api = mockApi();
    const view = render();
    fill("Factor 1 weight", "0");
    press("Save factors");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Use a whole number from -10 to 10, other than 0.",
    );
    expect(view.getByLabelText("Factor 1 weight")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(api.calls("setQuillsScoringFactors")).toHaveLength(0);
    press("Remove Impact");
    expect(view.queryByLabelText("Factor 1 name")).toBeNull();
  });
});
