import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getUserCompanyFixture } from "../../../api/team/get-user-company.fixture";
import { removeUserCompanyFixture } from "../../../api/team/remove-user-company.fixture";
import { setUserCompanyFixture } from "../../../api/team/set-user-company.fixture";
import { updateCompanyFixture } from "../../../api/team/update-company.fixture";
import { fill, press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import {
  TeamRuntimeProvider,
  type TeamRuntimeValue,
} from "../../../team/runtime";
import { postTeam } from "../../team-post/post.fixture";
import { MemberCompany } from "./member-company";

const company = {
  ...updateCompanyFixture.ok(),
  id: "company_acme",
  name: "Acme",
  plan: "Scale",
  mrrCents: 125050,
};
const team = (permissions: Partial<TeamRuntimeValue["permissions"]> = {}) => ({
  ...postTeam,
  permissions: { ...postTeam.permissions, ...permissions },
});
const render = (value = team(), companyId: string | null = "company_acme") =>
  renderComponent(
    <TeamRuntimeProvider value={value}>
      <MemberCompany
        workspaceId="workspace_test_1"
        principalId="principal_1"
        companyId={companyId}
      />
    </TeamRuntimeProvider>,
  );
const body = async (api: ReturnType<typeof mockApi>, operation: string) =>
  api.calls(operation)[0]!.clone().json();

describe("MemberCompany", () => {
  it("shows the plan and revenue and saves a new revenue in cents", async () => {
    const api = mockApi();
    api.reply(getUserCompanyFixture.ok({ company }));
    api.reply(updateCompanyFixture.ok({ ...company, mrrCents: 200000 }));
    api.reply(
      getUserCompanyFixture.ok({ company: { ...company, mrrCents: 200000 } }),
    );
    const view = render();
    expect(await view.findByRole("heading", { name: "Acme" })).toBeVisible();
    expect(view.getByText("1,250.50")).toBeVisible();
    press("Edit monthly revenue");
    fill("Company monthly revenue", "2000");
    press("Save revenue");
    await waitFor(() =>
      expect(api.calls("updateQuillsCompany")).toHaveLength(1),
    );
    expect(new URL(api.calls("updateQuillsCompany")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/companies/company_acme",
    );
    expect(await body(api, "updateQuillsCompany")).toEqual({
      mrrCents: 200000,
    });
  });

  it("adds a person without a company to one by name, reading nothing first", async () => {
    const api = mockApi();
    api.reply(setUserCompanyFixture.ok({ ...company }));
    const view = render(team(), null);
    expect(view.getByText("No company yet.")).toBeVisible();
    expect(api.calls()).toHaveLength(0);
    press("Add to a company");
    fill("Company name", "Northwind");
    press("Save company");
    await waitFor(() =>
      expect(api.calls("setQuillsUserCompany")).toHaveLength(1),
    );
    expect(new URL(api.calls("setQuillsUserCompany")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/users/principal_1/company",
    );
    expect(await body(api, "setQuillsUserCompany")).toEqual({
      name: "Northwind",
    });
  });

  it("removes the person from their company", async () => {
    const api = mockApi();
    api.reply(getUserCompanyFixture.ok({ company }));
    api.reply(removeUserCompanyFixture.ok());
    const view = render();
    await view.findByRole("heading", { name: "Acme" });
    press("Remove from company");
    await waitFor(() =>
      expect(api.calls("removeQuillsUserCompany")).toHaveLength(1),
    );
  });

  it("hides the revenue without view_revenue but keeps the company controls", async () => {
    const api = mockApi();
    api.reply(
      getUserCompanyFixture.ok({ company: { ...company, mrrCents: null } }),
    );
    const view = render(team({ viewRevenue: false }));
    await view.findByRole("heading", { name: "Acme" });
    expect(view.queryByText("Monthly revenue")).toBeNull();
    expect(
      view.queryByRole("button", { name: "Edit monthly revenue" }),
    ).toBeNull();
    expect(view.getByRole("button", { name: "Change company" })).toBeVisible();
  });

  it("offers no change without the update permission, and shows nothing without a company", async () => {
    const api = mockApi();
    api.reply(getUserCompanyFixture.ok({ company }));
    const view = render(team({ update: false }));
    await view.findByRole("heading", { name: "Acme" });
    expect(view.queryByRole("button")).toBeNull();
    view.unmount();
    const none = render(team({ update: false }), null);
    expect(none.queryByRole("heading")).toBeNull();
  });
});
