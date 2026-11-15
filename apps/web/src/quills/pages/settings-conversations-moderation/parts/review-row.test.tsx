import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { ReviewRow } from "./review-row";

const render = () =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({ initialEntries: ["/"] }),
      })}
    >
      <TeamRuntimeProvider
        value={{
          workspaceId: "workspace_test_1",
          viewer: { kind: "user", id: "user_1" },
          permissions: {
            read: true,
            create: true,
            update: true,
            delete: true,
            manageSettings: true,
          },
        }}
      >
        <ReviewRow
          workspaceId="workspace_test_1"
          kind="comment"
          id="comment_1"
          postId="post_1"
          title="Dark mode"
          content="Me too"
          detail="Ideas · Ada"
        />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );

describe("ReviewRow", () => {
  it("rejects a comment after a confirmation and links its post", async () => {
    const api = mockApi();
    api.reply({ id: "comment_1" });
    api.reply({ posts: [], comments: [], nextOffset: null });
    api.reply({ enabled: true, pendingCount: 0 });
    const view = render();
    expect(view.getByRole("link", { name: "Dark mode" })).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/posts/post_1",
    );
    fireEvent.click(view.getByRole("button", { name: "Reject" }));
    const dialog = await view.findByRole("alertdialog", {
      name: "Reject this comment?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    await waitFor(() =>
      expect(api.calls("rejectQuillsComment")).toHaveLength(1),
    );
    expect(await api.calls("rejectQuillsComment")[0]!.json()).toEqual({
      reason: "",
    });
  });
});
