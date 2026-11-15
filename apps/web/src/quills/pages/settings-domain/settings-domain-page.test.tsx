import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listCustomDomainsFixture } from "../../api/team/list-custom-domains.fixture";
import { listSettingsFixture } from "../../api/team/list-settings.fixture";
import { verifyPortalDomainFixture } from "../../api/team/verify-portal-domain.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsDomainPage } from "./settings-domain-page";

const portal = {
  kind: "portal" as const,
  domain: "feedback.acme.com",
  active: false,
  verifiedAt: null,
  checkedAt: null,
  checkResult: null,
  record: {
    type: "TXT" as const,
    name: "_quills-verification.feedback.acme.com",
    value: "token123",
  },
};
const settings = (helpCenter: boolean) => {
  const base = listSettingsFixture.ok();
  return listSettingsFixture.ok({
    modules: { ...base.modules, helpCenter },
  });
};

let api: ReturnType<typeof mockApi>;

describe("SettingsDomainPage", () => {
  describePageContract(meta, SettingsDomainPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        api.defer(() => undefined);
        api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        api.fail();
        api.fail();
      },
    },
    ready: {
      prepare: () => {
        const api = mockApi();
        api.reply(listCustomDomainsFixture.ok({ entitled: true }));
        api.reply(settings(false));
      },
      assert: async (view) => {
        expect(
          await view.findByRole("button", { name: "Add domain" }),
        ).toBeEnabled();
        expect(
          view.getByText(`${window.location.host}/portal/workspace_test_1`),
        ).toBeInTheDocument();
        expect(view.queryByText("Help center domain")).toBeNull();
      },
    },
    done: {
      prepare: () => {
        api = mockApi();
        api.reply(
          listCustomDomainsFixture.ok({ entitled: true, domains: [portal] }),
        );
        api.reply(settings(false));
        api.reply(verifyPortalDomainFixture.ok(portal));
        api.reply(
          listCustomDomainsFixture.ok({
            entitled: true,
            domains: [{ ...portal, checkResult: "missing" }],
          }),
        );
      },
      act: async (view) => {
        expect(await view.findByText("Pending")).toBeInTheDocument();
        fireEvent.click(view.getByRole("button", { name: "Check now" }));
      },
      assert: async (view) => {
        expect(await view.findByText("Record not found")).toBeInTheDocument();
        expect(api.calls("verifyQuillsPortalDomain")).toHaveLength(1);
      },
    },
  });

  it("shows the help center domain when the help center is on", async () => {
    const api = mockApi();
    api.reply(listCustomDomainsFixture.ok({ entitled: true }));
    api.reply(settings(true));
    const view = renderPage(SettingsDomainPage, meta);
    expect(await view.findByText("Help center domain")).toBeInTheDocument();
    expect(
      view.getByText(`${window.location.host}/portal/workspace_test_1/hc`),
    ).toBeInTheDocument();
    expect(view.getAllByRole("button", { name: "Add domain" })).toHaveLength(2);
  });

  it("sends the new portal domain", async () => {
    const api = mockApi();
    api.reply(listCustomDomainsFixture.ok({ entitled: true }));
    api.reply(settings(false));
    api.reply({ changed: true, domain: portal });
    api.reply(
      listCustomDomainsFixture.ok({ entitled: true, domains: [portal] }),
    );
    const view = renderPage(SettingsDomainPage, meta);
    fireEvent.click(await view.findByRole("button", { name: "Add domain" }));
    fireEvent.change(await view.findByLabelText("Domain"), {
      target: { value: "feedback.acme.com" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    expect(await view.findByText("feedback.acme.com")).toBeInTheDocument();
    await waitFor(() =>
      expect(api.calls("setQuillsPortalDomain")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsPortalDomain")[0]!.json()).toEqual({
      domain: "feedback.acme.com",
    });
  });

  it("locks Add domain without an active plan", async () => {
    const api = mockApi();
    api.reply(listCustomDomainsFixture.ok({ entitled: false }));
    api.reply(settings(false));
    const view = renderPage(SettingsDomainPage, meta);
    expect(
      await view.findByRole("button", { name: "Add domain" }),
    ).toBeDisabled();
  });
});
