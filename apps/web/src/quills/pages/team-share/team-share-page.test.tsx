import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getPortalSettingsFixture } from "../../api/team/get-portal-settings.fixture";
import { listCustomDomainsFixture } from "../../api/team/list-custom-domains.fixture";
import { listSettingsFixture } from "../../api/team/list-settings.fixture";
import { mintWidgetInstallCodeFixture } from "../../api/team/mint-widget-install-code.fixture";
import { updatePortalSettingsFixture } from "../../api/team/update-portal-settings.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { TeamSharePage } from "./team-share-page";

// better-auth keeps its own fetch; the page reads only the signed-in user.
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: "user_test_1", name: "Grace", image: null } },
    }),
  },
}));

const settings = listSettingsFixture.ok({
  name: "Acme",
  slug: "acme",
  modules: {
    feedback: true,
    changelog: true,
    helpCenter: false,
    supportInbox: false,
    supportTickets: false,
    statusPage: false,
  },
});
const portal = getPortalSettingsFixture.ok({
  enabled: true,
  nav: [
    {
      id: "roadmap",
      type: "roadmap",
      enabled: false,
      label: null,
      url: null,
      newTab: false,
    },
  ],
});
const domains = listCustomDomainsFixture.ok({
  entitled: true,
  domains: [
    {
      kind: "portal",
      domain: "feedback.acme.test",
      active: true,
      verifiedAt: null,
      checkedAt: null,
      checkResult: "verified",
      record: { type: "TXT", name: "_kaneo", value: "token" },
    },
  ],
});
let api: ReturnType<typeof mockApi>;
const replyAll = () => {
  api = mockApi();
  api.reply(settings);
  api.reply(portal);
  api.reply(domains);
};

describe("TeamSharePage", () => {
  describePageContract(meta, TeamSharePage, {
    loading: {
      prepare: () => {
        mockApi().defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        mockApi().fail();
      },
    },
    ready: {
      prepare: replyAll,
      assert: async (view) => {
        expect(
          await view.findByText("The Acme board is live"),
        ).toBeInTheDocument();
        await waitFor(() =>
          expect(view.getByRole("link", { name: "Visit" })).toHaveAttribute(
            "href",
            "https://feedback.acme.test",
          ),
        );
        expect(view.getByText("Grace from Acme")).toBeInTheDocument();
        // The portal navigation hides the roadmap.
        expect(view.getByRole("link", { name: "Changelog" })).toHaveAttribute(
          "href",
          "https://feedback.acme.test/changelog",
        );
        expect(view.queryByRole("link", { name: "Roadmap" })).toBeNull();
      },
    },
    done: {
      prepare: replyAll,
      act: async (view) => {
        await view.findByText("The Acme board is live");
        api.reply(mintWidgetInstallCodeFixture.ok({ code: "ABCD-1234" }));
        fireEvent.click(
          view.getByRole("button", { name: "Create install code" }),
        );
      },
      assert: async (view) => {
        expect(
          await view.findByRole("group", { name: "Install code" }),
        ).toHaveTextContent("ABCD-1234");
      },
    },
  });

  it("says the board is off and turns it on", async () => {
    const api = mockApi();
    api.reply(settings);
    api.reply({ ...portal, enabled: false });
    api.reply(domains);
    const view = renderPage(TeamSharePage, meta);
    expect(await view.findByText("The Acme board is off")).toBeInTheDocument();
    api.reply(updatePortalSettingsFixture.ok({ enabled: true }));
    api.reply(portal);
    fireEvent.click(view.getByRole("button", { name: "Turn on" }));
    expect(await view.findByText("The Acme board is live")).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Turn on" })).toBeNull();
    expect(await api.calls("updateQuillsPortalSettings")[0]!.json()).toEqual({
      enabled: true,
    });
  });

  it("uses the portal path and skips the managed reads without manage_settings", async () => {
    const api = mockApi();
    api.reply(settings);
    const view = renderPage(TeamSharePage, meta, {
      permissions: { manageSettings: false },
    });
    expect(await view.findByRole("link", { name: "Visit" })).toHaveAttribute(
      "href",
      `${window.location.origin}/portal/workspace_test_1`,
    );
    expect(view.getByRole("link", { name: "Roadmap" })).toBeInTheDocument();
    expect(
      view.queryByRole("button", { name: "Create install code" }),
    ).toBeNull();
    expect(api.calls()).toHaveLength(1);
  });
});
