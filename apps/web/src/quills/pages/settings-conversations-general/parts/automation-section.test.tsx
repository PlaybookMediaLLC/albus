import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getWorkflowAbandonedAutoCloseFixture } from "../../../api/team/get-workflow-abandoned-auto-close.fixture";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { AutomationSection } from "./automation-section";

const team = {
  workspaceId: "workspace_1",
  viewer: { kind: "user" as const, id: "user_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};

const render = (awayReply = { enabled: false, message: "Away" }) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <AutomationSection
        workspaceId="workspace_1"
        routing={false}
        autoAck={false}
        awayReply={awayReply}
        abandoned={{ enabled: true, waitMinutes: 7 }}
        closeSpam={false}
      />
    </TeamRuntimeProvider>,
  );

describe("AutomationSection", () => {
  it("turns routing on with the one strategy that exists", async () => {
    const api = mockApi();
    api.reply({ enabled: true, strategy: "auto_assign_active" });
    api.reply({ enabled: true, strategy: "auto_assign_active" });
    const view = render();
    fireEvent.click(
      view.getByRole("switch", { name: "Assign new conversations" }),
    );
    await waitFor(() =>
      expect(api.calls("setQuillsConversationRouting")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsConversationRouting")[0]!.json()).toEqual({
      enabled: true,
      strategy: "auto_assign_active",
    });
  });

  it("keeps a stored wait that the list does not have, and saves a new one", async () => {
    const api = mockApi();
    api.reply(getWorkflowAbandonedAutoCloseFixture.ok({ waitMinutes: 30 }));
    api.reply(getWorkflowAbandonedAutoCloseFixture.ok({ waitMinutes: 30 }));
    const view = render();
    expect(
      view.getByRole("combobox", { name: "Wait before closing" }),
    ).toHaveTextContent("7 minutes");
    await choose("Wait before closing", "30 minutes");
    await waitFor(() =>
      expect(api.calls("setQuillsWorkflowAbandonedAutoClose")).toHaveLength(1),
    );
    expect(
      await api.calls("setQuillsWorkflowAbandonedAutoClose")[0]!.json(),
    ).toEqual({ waitMinutes: 30 });
  });

  it("turns the away reply on and saves its message", async () => {
    const api = mockApi();
    api.reply({ enabled: true, message: "Away" });
    const view = render();
    fireEvent.click(view.getByRole("switch", { name: "Away reply" }));
    await waitFor(() =>
      expect(api.calls("setQuillsAwayReply")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsAwayReply")[0]!.json()).toEqual({
      enabled: true,
      message: "Away",
    });
    view.unmount();
    const editing = mockApi();
    editing.reply({ enabled: true, message: "Back at 9" });
    const form = render({ enabled: true, message: "Away" });
    fireEvent.change(form.getByLabelText("Away message"), {
      target: { value: "Back at 9" },
    });
    fireEvent.click(form.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(editing.calls("setQuillsAwayReply")).toHaveLength(1),
    );
    expect(await editing.calls("setQuillsAwayReply")[0]!.json()).toEqual({
      enabled: true,
      message: "Back at 9",
    });
  });
});
