import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vite-plus/test";
import { getUserFixture } from "../../../api/team/get-user.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { CustomerIdentity } from "./customer-identity";

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
const render = (name: string | null, email: string | null) =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory(),
      })}
    >
      <TeamRuntimeProvider value={team}>
        <CustomerIdentity
          workspaceId="workspace_test_1"
          principalId="principal_test_9"
          name={name}
          email={email}
        />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );

describe("CustomerIdentity", () => {
  it("shows the profile's name, email, badges, segments and tags, and links the profile", async () => {
    const api = mockApi();
    api.reply(
      getUserFixture.ok({
        name: "Grace Customer",
        email: "grace@example.test",
        isLead: true,
        blockedAt: "2026-11-01T00:00:00.000Z",
        segments: [
          { id: "s1", name: "Enterprise", color: "#6366f1", type: "manual" },
        ],
        tags: [{ id: "t1", name: "VIP", color: "#f59e0b" }],
      }),
    );
    const view = render(null, null);
    expect(
      await view.findByRole("heading", { level: 2, name: "Grace Customer" }),
    ).toBeInTheDocument();
    expect(view.getByText("grace@example.test")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Copy email" })).toBeVisible();
    expect(
      view.getByRole("link", { name: "Open the customer profile" }),
    ).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/members/principal_test_9",
    );
    const labels = view.getByRole("list", { name: "Segments and tags" });
    expect(labels).toHaveTextContent("Lead");
    expect(labels).toHaveTextContent("Blocked");
    expect(labels).toHaveTextContent("Enterprise");
    expect(labels).toHaveTextContent("VIP");
  });

  it("falls back to the conversation's copy without a profile, with no profile link", async () => {
    const api = mockApi();
    const missing = getUserFixture.problem(404);
    api.reply(missing.body, missing.status);
    const view = render("Visitor 12", null);
    await vi.waitFor(() => expect(api.calls()).toHaveLength(1));
    expect(
      view.getByRole("heading", { level: 2, name: "Visitor 12" }),
    ).toBeInTheDocument();
    expect(view.getByText("No email")).toBeInTheDocument();
    expect(view.queryByRole("link")).not.toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Copy email" })).toBeNull();
    expect(view.queryByRole("alert")).not.toBeInTheDocument();
  });
});
