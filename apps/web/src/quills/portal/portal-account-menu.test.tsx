import { describe, expect, it } from "vite-plus/test";
import { press } from "../test/actions";
import { renderComponent } from "../test/render";
import { PortalAccountMenu } from "./portal-account-menu";

describe("PortalAccountMenu", () => {
  it("opens My feedback, Preferences and Profile from one Account button", async () => {
    const view = renderComponent(<PortalAccountMenu workspaceId="ws_1" />);
    press("Account");
    expect(
      await view.findByRole("menuitem", { name: "My feedback" }),
    ).toHaveAttribute("href", "/portal/ws_1/my-feedback");
    expect(view.getByRole("menuitem", { name: "Preferences" })).toHaveAttribute(
      "href",
      "/portal/ws_1/preferences",
    );
    expect(view.getByRole("menuitem", { name: "Profile" })).toHaveAttribute(
      "href",
      "/portal/ws_1/profile",
    );
  });
});
