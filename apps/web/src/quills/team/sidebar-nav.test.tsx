import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, within } from "@testing-library/react";
import { Zap } from "lucide-react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { SidebarNav } from "./sidebar-nav";

describe("SidebarNav", () => {
  it("names each list by its section label and passes the choice on", () => {
    const onNavigate = vi.fn();
    const view = renderComponent(
      <RouterContextProvider
        router={createRouter({
          routeTree: createRootRoute(),
          history: createMemoryHistory(),
        })}
      >
        <SidebarNav
          label="Settings"
          onNavigate={onNavigate}
          sections={[
            {
              id: "connections",
              labelKey: "settings.sections.connections",
              items: [
                {
                  id: "api",
                  labelKey: "settings.nav.api",
                  icon: Zap,
                  to: "/feedback/workspace_1/settings/api",
                },
              ],
            },
          ]}
        >
          <p>Footer line</p>
        </SidebarNav>
      </RouterContextProvider>,
    );
    const nav = view.getByRole("navigation", { name: "Settings" });
    const list = within(nav).getByRole("list", { name: "Connections" });
    fireEvent.click(within(list).getByRole("link", { name: "API" }));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(within(nav).getByText("Footer line")).toBeVisible();
  });
});
