import { describe, expect, it } from "vite-plus/test";
import { PortalThemeContext } from "../core/portal-theme-context";
import { renderComponent } from "../test/render";
import { PortalMenuPopup } from "./portal-menu-popup";
import { Menu, MenuItem, MenuTrigger } from "./upstream";

describe("PortalMenuPopup", () => {
  it("carries scoped workspace colors into the body-mounted popup", async () => {
    const view = renderComponent(
      <PortalThemeContext
        value={{ "--popover": "#123456" } as React.CSSProperties}
      >
        <Menu defaultOpen>
          <MenuTrigger>Open</MenuTrigger>
          <PortalMenuPopup>
            <MenuItem>One</MenuItem>
          </PortalMenuPopup>
        </Menu>
      </PortalThemeContext>,
    );
    expect(
      (await view.findByRole("menuitem", { name: "One" })).closest(
        '[data-slot="menu-popup"]',
      ),
    ).toHaveStyle("--popover: #123456");
  });
});
