import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getTicketWatchStatusFixture } from "../../../api/team/get-ticket-watch-status.fixture";
import { muteTicketFixture } from "../../../api/team/mute-ticket.fixture";
import { watchTicketFixture } from "../../../api/team/watch-ticket.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { TicketMenu } from "./ticket-menu";

function render(
  status = getTicketWatchStatusFixture.ok(),
  { create = false, update = false, hasRequester = false } = {},
) {
  const api = mockApi();
  api.reply(status);
  const view = renderComponent(
    <TeamRuntimeProvider
      value={{
        workspaceId: "workspace_test_1",
        viewer: { kind: "user", id: "user_test_1" },
        permissions: {
          read: true,
          create,
          update,
          delete: false,
          manageSettings: false,
        },
      }}
    >
      <TicketMenu ticketId="ticket_test_1" hasRequester={hasRequester} />
    </TeamRuntimeProvider>,
  );
  return { api, view };
}

const item = async (view: ReturnType<typeof render>["view"], name: string) => {
  press("More ticket actions");
  const entry = await view.findByRole("menuitem", { name });
  await waitFor(() => expect(entry).not.toHaveAttribute("data-disabled"));
  fireEvent.click(entry);
};

describe("TicketMenu", () => {
  it("offers to record the requester's request only with a requester and the create permission", async () => {
    const { view } = render(getTicketWatchStatusFixture.ok(), {
      create: true,
      update: true,
      hasRequester: true,
    });
    press("More ticket actions");
    expect(
      await view.findByRole("menuitem", {
        name: "Record a request for the requester",
      }),
    ).toBeVisible();
  });

  it("does not offer it without the update permission", async () => {
    const { view } = render(getTicketWatchStatusFixture.ok(), {
      create: true,
      hasRequester: true,
    });
    press("More ticket actions");
    await view.findAllByRole("menuitem");
    expect(
      view.queryByRole("menuitem", {
        name: "Record a request for the requester",
      }),
    ).toBeNull();
  });

  it("does not offer it for a ticket without a requester", async () => {
    const { view } = render(getTicketWatchStatusFixture.ok(), {
      create: true,
      update: true,
    });
    press("More ticket actions");
    await view.findAllByRole("menuitem");
    expect(
      view.queryByRole("menuitem", {
        name: "Record a request for the requester",
      }),
    ).toBeNull();
  });

  it("lets a reader watch the ticket", async () => {
    const { api, view } = render();
    await waitFor(() => expect(api.calls()).toHaveLength(1));
    api.reply(watchTicketFixture.ok({ watching: true, reason: "manual" }));
    api.reply(getTicketWatchStatusFixture.ok({ watching: true }));
    await item(view, "Watch");
    await waitFor(() => expect(api.calls("watchQuillsTicket")).toHaveLength(1));
    expect(new URL(api.calls("watchQuillsTicket")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/tickets/ticket_test_1/watch",
    );
  });

  it("mutes a watched ticket for a week", async () => {
    const { api, view } = render(
      getTicketWatchStatusFixture.ok({ watching: true, reason: "manual" }),
    );
    await waitFor(() => expect(api.calls()).toHaveLength(1));
    api.reply(muteTicketFixture.ok({ watching: true }));
    api.reply(getTicketWatchStatusFixture.ok({ watching: true }));
    await item(view, "Mute for 7 days");
    await waitFor(() => expect(api.calls("muteQuillsTicket")).toHaveLength(1));
    expect(await api.calls("muteQuillsTicket")[0]!.clone().json()).toEqual({
      days: 7,
    });
  });

  it("offers unmute and stop watching while the ticket is muted", async () => {
    const { view } = render(
      getTicketWatchStatusFixture.ok({
        watching: true,
        mutedUntil: "2999-01-01T00:00:00.000Z",
      }),
    );
    press("More ticket actions");
    expect(
      await view.findByRole("menuitem", { name: "Unmute" }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("menuitem", { name: "Stop watching" }),
    ).toBeInTheDocument();
  });
});
