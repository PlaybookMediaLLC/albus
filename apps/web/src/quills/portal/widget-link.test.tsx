import { describe, expect, it, vi } from "vite-plus/test";
import { declinePortalWidgetLinkFixture } from "../api/portal/decline-portal-widget-link.fixture";
import { getPortalWidgetLinkFixture } from "../api/portal/get-portal-widget-link.fixture";
import { linkPortalWidgetProfileFixture } from "../api/portal/link-portal-widget-profile.fixture";
import { press } from "../test/actions";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { PortalWidgetLink } from "./widget-link";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: { user: { id: "user_test_1" } } }),
  },
}));

const mount = () =>
  renderComponent(
    <PortalWidgetLink workspaceId="workspace_test_1" workspaceName="Acme" />,
  );
const prompt = { name: "Link your activity from the support widget?" };

describe("PortalWidgetLink", () => {
  it("shows nothing and links nothing without a pending request", async () => {
    const api = mockApi();
    api.reply(getPortalWidgetLinkFixture.ok({ pending: false }));
    const view = mount();
    await vi.waitFor(() => expect(api.calls()).toHaveLength(1));
    expect(view.queryByRole("region", prompt)).toBeNull();
    expect(api.calls("linkQuillsPortalWidgetProfile")).toHaveLength(0);
  });

  it("links only when the person confirms", async () => {
    const api = mockApi();
    api.reply(getPortalWidgetLinkFixture.ok({ pending: true }));
    api.reply(linkPortalWidgetProfileFixture.ok());
    api.reply(getPortalWidgetLinkFixture.ok({ pending: false }));
    const view = mount();
    await view.findByRole("region", prompt);
    expect(api.calls("linkQuillsPortalWidgetProfile")).toHaveLength(0);
    press("Link my activity");
    expect(
      await view.findByText(
        "Your activity from the support widget is now in the portal.",
      ),
    ).toHaveAttribute("role", "status");
    expect(api.calls("linkQuillsPortalWidgetProfile")).toHaveLength(1);
  });

  it("ends the request when the person refuses", async () => {
    const api = mockApi();
    api.reply(getPortalWidgetLinkFixture.ok({ pending: true }));
    api.reply(declinePortalWidgetLinkFixture.ok());
    api.reply(getPortalWidgetLinkFixture.ok({ pending: false }));
    const view = mount();
    await view.findByRole("region", prompt);
    press("This wasn't me");
    expect(await view.findByText("Nothing was linked.")).toHaveAttribute(
      "role",
      "status",
    );
    expect(api.calls("declineQuillsPortalWidgetLink")).toHaveLength(1);
    expect(api.calls("linkQuillsPortalWidgetProfile")).toHaveLength(0);
  });
});
