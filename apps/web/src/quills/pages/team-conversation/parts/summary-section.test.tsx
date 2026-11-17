import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import type { ReactElement } from "react";
import { describe, expect, it } from "vite-plus/test";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { requestConversationSummaryFixture } from "../../../api/team/request-conversation-summary.fixture";
import { press } from "../../../test/actions";
import { SummarySection, type SummarySectionProps } from "./summary-section";

const team = (manageSettings = true) => ({
  workspaceId: "workspace_test_1",
  viewer: { kind: "user" as const, id: "user_test_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings,
  },
});
const wrap = (element: ReactElement, manageSettings = true) => (
  <RouterContextProvider
    router={createRouter({
      routeTree: createRootRoute(),
      history: createMemoryHistory(),
    })}
  >
    <TeamRuntimeProvider value={team(manageSettings)}>
      {element}
    </TeamRuntimeProvider>
  </RouterContextProvider>
);
const props = (values: Partial<SummarySectionProps>): SummarySectionProps => ({
  workspaceId: "workspace_test_1",
  conversationId: "conversation_test_1",
  summary: null,
  summaryUpdatedAt: null,
  ...values,
});

describe("SummarySection", () => {
  it("shows the summary, asks for a new one and waits until a newer one arrives", async () => {
    const api = mockApi();
    api.reply(requestConversationSummaryFixture.ok());
    const first = props({
      summary: "The export fails on large files.",
      summaryUpdatedAt: "2026-11-01T10:00:00.000Z",
    });
    const view = renderComponent(wrap(<SummarySection {...first} />));
    expect(
      view.getByText("The export fails on large files."),
    ).toBeInTheDocument();
    expect(view.getByText(/^Updated /)).toBeInTheDocument();
    press("Summarize again");
    expect(await view.findByText(/on its way/)).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "Summarize again" }),
    ).toBeDisabled();
    expect(api.calls("requestQuillsConversationSummary")).toHaveLength(1);

    view.rerender(
      wrap(
        <SummarySection
          {...first}
          summary="Export works again after the fix."
          summaryUpdatedAt="2026-11-02T10:00:00.000Z"
        />,
      ),
    );
    expect(view.queryByText(/on its way/)).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Summarize again" })).toBeEnabled();
  });

  it("says that AI is off and links an admin to the AI settings", async () => {
    const api = mockApi();
    const off = requestConversationSummaryFixture.problem(409);
    api.reply(off.body, off.status);
    const view = renderComponent(wrap(<SummarySection {...props({})} />));
    expect(
      view.getByText(
        "No summary yet. Summarize the thread to see its main points.",
      ),
    ).toBeInTheDocument();
    press("Summarize");
    expect(
      await view.findByText("AI is off for this workspace."),
    ).toBeInTheDocument();
    expect(
      view.queryByRole("button", { name: "Summarize" }),
    ).not.toBeInTheDocument();
    expect(view.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      view.getByRole("link", { name: "Turn on AI in settings" }),
    ).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/settings/conversations/ai",
    );
  });

  it("offers the settings link only to a teammate who manages settings", async () => {
    const api = mockApi();
    const off = requestConversationSummaryFixture.problem(409);
    api.reply(off.body, off.status);
    const view = renderComponent(
      wrap(<SummarySection {...props({})} />, false),
    );
    press("Summarize");
    await view.findByText("AI is off for this workspace.");
    expect(view.queryByRole("link")).not.toBeInTheDocument();
  });
});
