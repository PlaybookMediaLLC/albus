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

  it.each([
    ["unsubscribe", true],
    ["csat", true],
    ["status", true],
    ["roadmap", false],
  ])(
    "opens the mail-linked %s page while the portal is off: %s",
    async (page, opens) => {
      const api = mockApi();
      api.reply({ message: "Portal not found" }, 404);
      api.reply({ message: "Portal not found" }, 404);
      const root = createRootRoute();
      const portal = createRoute({
        getParentRoute: () => root,
        path: "/portal/$workspaceId",
        component: PortalRoute,
      });
      const child = createRoute({
        getParentRoute: () => portal,
        path: `/${page}`,
        component: () => <p>Child page</p>,
      });
      const router = createRouter({
        routeTree: root.addChildren([portal.addChildren([child])]),
        history: createMemoryHistory({
          initialEntries: [`/portal/workspace_test_1/${page}`],
        }),
      });
      const view = renderComponent(<RouterProvider router={router} />);
      if (opens) expect(await view.findByText("Child page")).toBeVisible();
      else {
        expect(await view.findByRole("alert")).toHaveTextContent(
          /could not be found/i,
        );
        expect(view.queryByText("Child page")).toBeNull();
      }
    },
  );
});
