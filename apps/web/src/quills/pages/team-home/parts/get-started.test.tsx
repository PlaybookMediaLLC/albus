import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { GetStarted } from "./get-started";

const render = () =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory(),
      })}
    >
      <GetStarted workspaceId="workspace_test_1" />
    </RouterContextProvider>,
  );

describe("GetStarted", () => {
  afterEach(() => window.localStorage.clear());

  it("links the three setup steps and hides them for good", () => {
    const view = render();
    expect(
      view.getByRole("heading", { level: 2, name: "Get started" }),
    ).toBeVisible();
    expect(
      view.getByRole("link", { name: /Brand your portal/ }),
    ).toHaveAttribute("href", expect.stringMatching(/\/settings\/branding$/));
    expect(view.getByRole("link", { name: /Add the widget/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/settings\/conversations\/widget$/),
    );
    expect(view.getByRole("link", { name: /Invite your team/ })).toBeVisible();
    press("Hide getting started");
    expect(view.queryByRole("heading", { name: "Get started" })).toBeNull();
    view.unmount();
    expect(render().queryByRole("heading", { name: "Get started" })).toBeNull();
  });
});
