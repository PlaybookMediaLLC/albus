import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getEmailChannelConfigFixture } from "../../api/team/get-email-channel-config.fixture";
import { getEmailChannelStatusFixture } from "../../api/team/get-email-channel-status.fixture";
import { listRecentEmailLogFixture } from "../../api/team/list-recent-email-log.fixture";
import { setInboundForwardingFixture } from "../../api/team/set-inbound-forwarding.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsConversationsEmailPage } from "./settings-conversations-email-page";

const route = setInboundForwardingFixture.ok({
  address: "inbox@mail.example.test",
});
const config = getEmailChannelConfigFixture.ok({
  inboundRoute: route,
  sendingAddresses: [
    setInboundForwardingFixture.ok({
      id: "account_1",
      role: "sending",
      address: "help@example.test",
    }),
  ],
  domains: [
    {
      id: "domain_1",
      domain: "example.test",
      status: "pending",
      dnsRecords: [
        {
          type: "TXT",
          host: "_dmarc",
          value: "v=DMARC1; p=none",
          purpose: "DMARC",
        },
      ],
      verifiedAt: null,
      mailFromLabel: "mail",
      dkimMode: "easy",
      signingKeyPending: false,
      autoCheckUntil: null,
      lastCheckedAt: null,
    },
  ],
});

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(getEmailChannelStatusFixture.ok({ inboundConfigured: true }));
  api.reply(config);
  api.reply(listRecentEmailLogFixture.ok());
};

describe("SettingsConversationsEmailPage", () => {
  describePageContract(meta, SettingsConversationsEmailPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 3; index += 1) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 3; index += 1) api.fail();
      },
    },
    ready: {
      prepare: ready,
      assert: async (view) => {
        expect(await view.findByText("Receiving")).toBeVisible();
        expect(
          view.getByRole("group", { name: "Inbox address" }),
        ).toHaveTextContent("inbox@mail.example.test");
        expect(view.getByText("help@example.test")).toBeVisible();
        expect(
          view.getByRole("group", { name: "TXT record value" }),
        ).toHaveTextContent("v=DMARC1; p=none");
        expect(view.getByText("No email yet")).toBeVisible();
      },
    },
    done: {
      prepare: () => {
        ready();
        api.reply({ ...route, forwardingTarget: "team@example.test" });
        api.reply(config);
      },
      act: async (view) => {
        fireEvent.change(await view.findByLabelText("Forward a copy to"), {
          target: { value: "team@example.test" },
        });
        fireEvent.click(view.getByRole("button", { name: "Save" }));
      },
      assert: async () => {
        await waitFor(() =>
          expect(api.calls("setQuillsInboundForwarding")).toHaveLength(1),
        );
        expect(
          await api.calls("setQuillsInboundForwarding")[0]!.json(),
        ).toEqual({ forwardingTarget: "team@example.test" });
      },
    },
  });

  it("adds a sending address for the chosen area", async () => {
    ready();
    api.reply(setInboundForwardingFixture.ok({ address: "news@example.test" }));
    api.reply(config);
    const view = renderPage(SettingsConversationsEmailPage, meta);
    fireEvent.click(await view.findByRole("button", { name: "Add address" }));
    const dialog = await view.findByRole("dialog", { name: "Add address" });
    fireEvent.change(within(dialog).getByLabelText("Address"), {
      target: { value: "news@example.test" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(api.calls("createQuillsSendingAddress")).toHaveLength(1),
    );
    expect(await api.calls("createQuillsSendingAddress")[0]!.json()).toEqual({
      address: "news@example.test",
      module: "support",
    });
  });
});
