import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createConversationViewFixture } from "../../../api/team/create-conversation-view.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { fill, press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { SaveCurrentView } from "./save-current-view";

const team = {
  workspaceId: "workspace_test_1",
  viewer: { kind: "user" as const, id: "user_test_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};

describe("SaveCurrentView", () => {
  it("saves the list and keeps the conversation open beside the saved view", async () => {
    mockApi().reply(createConversationViewFixture.ok({ id: "view_test_5" }));
    const router = createRouter({
      routeTree: createRootRoute(),
      history: createMemoryHistory(),
    });
    const onOpenChange = vi.fn();
    renderComponent(
      <RouterContextProvider router={router}>
        <TeamRuntimeProvider value={team}>
          <SaveCurrentView
            workspaceId="workspace_test_1"
            conversationId="conversation_test_1"
            context={{ view: "mine", status: "open" }}
            open
            onOpenChange={onOpenChange}
          />
        </TeamRuntimeProvider>
      </RouterContextProvider>,
    );
    fill("View name", "Mine open");
    press("Save view");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() =>
      expect(router.state.location.href).toBe(
        "/feedback/workspace_test_1/conversations/conversation_test_1?view=mine&status=open&savedView=view_test_5",
      ),
    );
  });
});
