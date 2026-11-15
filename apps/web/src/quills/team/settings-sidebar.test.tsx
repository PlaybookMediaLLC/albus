import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { listSettingsFixture } from "../api/team/list-settings.fixture";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { TeamRuntimeProvider } from "./runtime";
import { SettingsSidebar } from "./settings-sidebar";

const config = vi.hoisted(() => ({ billingEnabled: true }));
vi.mock("@/hooks/queries/config/use-get-config", () => ({
  default: () => ({ data: config }),
}));

const modules = listSettingsFixture.ok().modules;

function render(settings = listSettingsFixture.ok()) {
  const api = mockApi();
  api.reply(settings);
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({
      initialEntries: ["/feedback/workspace_1/settings/api"],
    }),
  });
  const view = renderComponent(
    <RouterContextProvider router={router}>
      <TeamRuntimeProvider
        value={{
          workspaceId: "workspace_1",
          viewer: { kind: "user", id: "user_1" },
          permissions: {
            read: true,
            create: true,
            update: true,
            delete: true,
            manageSettings: true,
          },
        }}
      >
        <SettingsSidebar workspaceId="workspace_1" />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );
  return Object.assign(view, { api, router });
}

beforeEach(() => {
  config.billingEnabled = true;
});

describe("SettingsSidebar", () => {
  it("shows the title, Back, the settings sections, the current page and Docs", async () => {
    const view = render(
      listSettingsFixture.ok({
        modules: { ...modules, feedback: true, supportInbox: true },
      }),
    );
    expect(view.getByText("Settings")).toBeVisible();
    expect(view.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/feedback/workspace_1",
    );
    const nav = view.getByRole("navigation", { name: "Settings" });
    for (const name of [
      "Personal",
      "Workspace",
      "Product",
      "Conversations",
      "Connections",
    ])
      expect(within(nav).getByRole("list", { name })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "API" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      await within(nav).findByRole("link", { name: "Feedback" }),
    ).toHaveAttribute("href", "/feedback/workspace_1/settings/feedback");
    expect(view.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(view.api.calls("listQuillsSettings")).toHaveLength(1);
  });

  it("hides the items of modules that are off and Billing when the instance does not bill", async () => {
    config.billingEnabled = false;
    const view = render();
    const nav = view.getByRole("navigation", { name: "Settings" });
    await waitFor(() =>
      expect(
        within(nav).queryByRole("link", { name: "Feedback" }),
      ).not.toBeInTheDocument(),
    );
    expect(within(nav).queryByRole("link", { name: "Billing" })).toBeNull();
    expect(within(nav).queryByRole("link", { name: "General" })).toBeNull();
    expect(within(nav).getByRole("link", { name: "Widget" })).toBeVisible();
  });

  it("filters the items, says when nothing matches, clears on Escape and opens the first match on Enter", () => {
    const view = render();
    const nav = view.getByRole("navigation", { name: "Settings" });
    const search = view.getByRole("searchbox", { name: "Search settings…" });
    fireEvent.change(search, { target: { value: "connections" } });
    expect(within(nav).getAllByRole("list")).toHaveLength(1);
    fireEvent.change(search, { target: { value: "nothing like this" } });
    expect(within(nav).getByText("No settings found")).toBeVisible();
    fireEvent.keyDown(search, { key: "Escape" });
    expect(search).toHaveValue("");
    expect(within(nav).getAllByRole("list")).toHaveLength(5);
    fireEvent.change(search, { target: { value: "import" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(view.router.history.location.pathname).toBe(
      "/feedback/workspace_1/settings/data",
    );
  });
});
