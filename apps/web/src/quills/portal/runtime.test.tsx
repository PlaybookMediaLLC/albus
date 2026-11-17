import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../test/render";
import {
  PortalRuntimeProvider,
  usePortalRuntime,
  type PortalRuntimeValue,
} from "./runtime";
import { getPublicPortalConfigFixture } from "../api/portal/get-public-portal-config.fixture";

const value: PortalRuntimeValue = {
  config: {
    name: "Workspace",
    features: {
      allowAnonymous: false,
      allowEditAfterEngagement: false,
      allowDeleteAfterEngagement: false,
      showPublicEditHistory: false,
      ai: true,
    },
    portalAccess: { isPrivate: false },
    nav: getPublicPortalConfigFixture.ok().nav,
    branding: {
      logoUrl: null,
      theme: { themeMode: "user", light: {}, dark: {} },
      headerDisplayMode: "logo_and_name",
      headerDisplayName: null,
    },
  },
  viewer: { kind: "anonymous" },
  access: {
    granted: true,
    reason: "public",
    signIn: { mode: "account", ssoUrl: null },
  },
  accessLoading: false,
  accessProblem: null,
};

function Consumer() {
  return <span>{usePortalRuntime().config.name}</span>;
}

describe("PortalRuntimeProvider", () => {
  it("shares the resolved portal state with a child page", () => {
    const view = renderComponent(
      <PortalRuntimeProvider value={value}>
        <Consumer />
      </PortalRuntimeProvider>,
    );
    expect(view.getByText("Workspace")).toBeInTheDocument();
  });
});
