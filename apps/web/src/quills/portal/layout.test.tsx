import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";
import { evaluateMyPortalAccessFixture } from "../api/portal/evaluate-my-portal-access.fixture";
import { getPublicPortalConfigFixture } from "../api/portal/get-public-portal-config.fixture";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { PortalLayout, PortalRoute } from "./layout";

describe("PortalLayout", () => {
  it("exports the shell and route component", () => {
    expect(PortalLayout).toBeTypeOf("function");
    expect(PortalRoute).toBeTypeOf("function");
  });

  it("shows every tab when an older API sends no nav", async () => {
    const { nav: _nav, ...config } = getPublicPortalConfigFixture.ok();
    const api = mockApi();
    api.reply(config);
    api.reply(evaluateMyPortalAccessFixture.ok({ granted: true }));
    const root = createRootRoute();
    const portal = createRoute({
      getParentRoute: () => root,
      path: "/portal/$workspaceId",
      component: PortalRoute,
    });
    const router = createRouter({
      routeTree: root.addChildren([portal]),
      history: createMemoryHistory({
        initialEntries: ["/portal/workspace_test_1"],
      }),
    });
    const view = renderComponent(<RouterProvider router={router} />);
    expect(await view.findByRole("link", { name: "Roadmap" })).toBeVisible();
    expect(view.getByRole("link", { name: "Updates" })).toBeVisible();
  });
});
