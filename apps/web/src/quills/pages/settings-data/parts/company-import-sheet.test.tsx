import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { importCompaniesFixture } from "../../../api/team/import-companies.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { toast } from "../../../ui/upstream";
import { postTeam } from "../../team-post/post.fixture";
import { CompanyImportSheet } from "./company-import-sheet";

const render = () =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <CompanyImportSheet workspaceId="workspace_test_1" />
    </TeamRuntimeProvider>,
  );
const open = async (view: ReturnType<typeof render>) => {
  fireEvent.click(view.getByRole("button", { name: /Import companies/ }));
  return view.findByRole("dialog", {
    name: "Import companies from a CSV file",
  });
};

describe("CompanyImportSheet", () => {
  it("sends the CSV text and reports the counts", async () => {
    const success = vi.spyOn(toast, "success");
    const api = mockApi();
    api.reply(importCompaniesFixture.ok({ created: 1, updated: 2 }));
    const view = render();
    const sheet = await open(view);
    const csv = "name,mrr\nAcme,1250.50\n";
    fireEvent.change(within(sheet).getByLabelText("CSV file"), {
      target: {
        files: [new File([csv], "companies.csv", { type: "text/csv" })],
      },
    });
    press("Import companies");
    await waitFor(() =>
      expect(api.calls("importQuillsCompanies")).toHaveLength(1),
    );
    expect(await api.calls("importQuillsCompanies")[0]!.json()).toEqual({
      csv,
    });
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("1 companies created, 2 updated."),
    );
  });

  it("asks for a file before it sends anything", async () => {
    const api = mockApi();
    const view = render();
    const sheet = await open(view);
    press("Import companies");
    expect(
      await within(sheet).findByText("Choose a CSV file of at most 100 KB."),
    ).toBeVisible();
    expect(api.calls()).toHaveLength(0);
  });
});
