import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vite-plus/test";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { getUserCompanyFixture } from "../../../api/team/get-user-company.fixture";
import { getUserFixture } from "../../../api/team/get-user.fixture";
import { CustomerSection } from "./customer-section";

const team = {
  workspaceId: "workspace_test_1",
  viewer: { kind: "user" as const, id: "user_test_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};
const render = (element: ReactElement) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>{element}</TeamRuntimeProvider>,
  );

describe("CustomerSection", () => {
  it("shows the company, when the customer joined, their activity and attributes", async () => {
    const api = mockApi();
    api.reply(
      getUserFixture.ok({
        companyId: "company_test_1",
        country: "France",
        joinedAt: "2026-03-04T00:00:00.000Z",
        postCount: 1,
        voteCount: 8,
        commentCount: 0,
        attributes: [
          { key: "seats", value: 300 },
          { key: "beta", value: true },
        ],
      }),
    );
    api.reply(
      getUserCompanyFixture.ok({
        company: {
          id: "company_test_1",
          name: "Acme",
          domain: null,
          externalId: null,
          plan: "Pro",
          mrrCents: 120000,
          size: null,
          website: null,
          industry: null,
          source: "manual",
          attributes: [],
          memberCount: 3,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );
    const view = render(
      <CustomerSection
        workspaceId="workspace_test_1"
        principalId="principal_test_9"
      />,
    );
    expect(await view.findByText("Acme")).toBeInTheDocument();
    expect(
      view.getByRole("heading", { level: 2, name: "Customer" }),
    ).toBeInTheDocument();
    expect(view.getByText("Pro")).toBeInTheDocument();
    expect(view.getByText("1,200")).toBeInTheDocument();
    expect(view.getByText("France")).toBeInTheDocument();
    expect(view.getByText("Mar 2026")).toBeInTheDocument();
    // A zero count is left out.
    expect(view.getByText("1 request · 8 votes")).toBeInTheDocument();
    expect(view.getByText("300")).toBeInTheDocument();
    expect(view.getByText("Yes")).toBeInTheDocument();
  });

  it("is left out for a visitor without a profile", async () => {
    const api = mockApi();
    const missing = getUserFixture.problem(404);
    api.reply(missing.body, missing.status);
    const view = render(
      <CustomerSection
        workspaceId="workspace_test_1"
        principalId="principal_test_9"
      />,
    );
    await vi.waitFor(() => expect(api.calls()).toHaveLength(1));
    expect(view.container).toBeEmptyDOMElement();
    expect(api.calls("getQuillsUserCompany")).toHaveLength(0);
  });
});
