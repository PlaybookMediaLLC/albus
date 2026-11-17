import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createCommentFixture } from "../../api/team/create-comment.fixture";
import { deletePostFixture } from "../../api/team/delete-post.fixture";
import { getLinkedConversationsForPostFixture } from "../../api/team/get-linked-conversations-for-post.fixture";
import { listPostTasksFixture } from "../../api/team/list-post-tasks.fixture";
import { listMergedPostsFixture } from "../../api/team/list-merged-posts.fixture";
import { mergePostFixture } from "../../api/team/merge-post.fixture";
import { setPostStatusFixture } from "../../api/team/set-post-status.fixture";
import { press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import {
  inboxBoards,
  inboxPosts,
  inboxStatuses,
} from "../team-posts/inbox.fixture";
import { meta } from "./meta";
import {
  postComments,
  postDemand,
  postDetail,
  postVoters,
} from "./post.fixture";
import { TeamPostPage } from "./team-post-page";

type Api = ReturnType<typeof mockApi>;
/** An answer that never comes, so its request stays in flight. */
const never = Symbol("never");
/** A body, or a function of the number of earlier calls of the operation. */
type Answer = unknown | ((calls: number) => unknown);

const options = {
  params: { postId: "post_export" },
  search: { board: "board_ideas" },
};
// The page requests, then the voters of the chip row and the panel (meta.ts).
const reads = (overrides: Record<string, Answer> = {}) => ({
  getQuillsPost: postDetail,
  listQuillsPostComments: postComments,
  listQuillsStatuses: inboxStatuses,
  listQuillsBoards: inboxBoards,
  listQuillsPosts: inboxPosts,
  listQuillsPostVoters: postVoters,
  getQuillsPostDemand: postDemand,
  listQuillsPostTasks: listPostTasksFixture.ok(),
  getQuillsLinkedConversationsForPost:
    getLinkedConversationsForPostFixture.ok(),
  listQuillsMergedPosts: listMergedPostsFixture.ok(),
  ...overrides,
});

/**
 * Answers each request by its operation. The request and the list pane load in parallel, so
 * the order is not fixed. An operation without an answer fails with 500.
 */
function answer(api: Api, answers: Record<string, Answer> = reads()) {
  for (let index = 0; index < 40; index += 1)
    api.defer(({ resolve }) => {
      const request = api.calls().at(-1)!;
      const id = Object.keys(answers).find((operation) =>
        api.calls(operation).includes(request),
      );
      const value = id ? answers[id] : undefined;
      const body =
        typeof value === "function"
          ? value(api.calls(id!).indexOf(request))
          : value;
      if (body === never) return;
      resolve(body ?? { message: "Failed" }, body === undefined ? 500 : 200);
    });
  return api;
}
const prepare = (answers?: Record<string, Answer>) =>
  answer(mockApi(), answers);
const render = () => renderPage(TeamPostPage, meta, options);
// The request shows once its page requests have an answer.
const loaded = (view: ReturnType<typeof render>) =>
  view.findByRole("group", { name: "Request actions" });
const listPane = (view: ReturnType<typeof render>) =>
  view.getByRole("region", { name: "Requests" });
const comment = (view: ReturnType<typeof render>, text: string) => {
  const box = view.getByRole("textbox", { name: "Write a comment…" });
  fireEvent.change(box, { target: { value: text } });
  fireEvent.keyDown(box, { key: "Enter" });
};

describe("TeamPostPage", () => {
  describePageContract(meta, TeamPostPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 4; index++) api.defer(() => undefined);
        return options;
      },
    },
    failed: {
      prepare: () => {
        prepare(reads({ getQuillsPost: undefined }));
        return options;
      },
    },
    ready: {
      prepare: () => {
        prepare();
        return options;
      },
      assert: async (view) => {
        await loaded(view);
        expect(
          view.getByRole("complementary", { name: "Request properties" }),
        ).toHaveTextContent("Enterprise");
      },
    },
    done: {
      prepare: () => {
        prepare(reads({ createQuillsComment: createCommentFixture.ok() }));
        return options;
      },
      act: async (view) => {
        await loaded(view);
        comment(view, "We ship it in June.");
        await waitFor(() =>
          expect(
            view.getByRole("textbox", { name: "Write a comment…" }),
          ).toHaveValue(""),
        );
      },
    },
  });

  it("shows the request, its chips, the comments and the properties", async () => {
    prepare();
    const view = render();
    expect(
      await view.findByRole("heading", { level: 1, name: "Export to CSV" }),
    ).toBeVisible();
    await loaded(view);
    expect(view.getByText(postDetail.content)).toBeVisible();
    expect(view.getByRole("button", { name: "Board: Ideas" })).toBeVisible();
    expect(view.getByText("On board")).toBeVisible();
    expect(view.getByText("API")).toBeVisible();
    expect(
      view.getByRole("button", { name: "Add my vote (3 votes)" }),
    ).toBeVisible();
    expect(
      view.getByText("Two enterprise accounts ask for this."),
    ).toBeVisible();
    expect(view.getByText("Private note")).toBeVisible();
    expect(view.getByRole("button", { name: "Back to Ideas" })).toBeVisible();
    const panel = view.getByRole("complementary", {
      name: "Request properties",
    });
    expect(
      await within(panel).findByText("Enterprise (2 voters)"),
    ).toBeVisible();
    expect(within(panel).getByText("40")).toBeVisible();
    expect(
      await within(listPane(view)).findByRole("link", {
        name: /Export to CSV/,
      }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("shows the request while the list still loads", async () => {
    prepare(reads({ listQuillsPosts: never }));
    const view = render();
    await loaded(view);
    expect(view.getByText(postDetail.content)).toBeVisible();
    expect(within(listPane(view)).getByText("Loading…")).toBeVisible();
  });

  it("shows a list failure in the list pane, keeps the request and retries the list", async () => {
    const answers = reads({ listQuillsPosts: undefined });
    prepare(answers);
    const view = render();
    await loaded(view);
    expect(view.getByText(postDetail.content)).toBeVisible();
    const list = listPane(view);
    expect(await within(list).findByRole("alert")).toHaveTextContent(
      /went wrong/i,
    );
    answers.listQuillsPosts = inboxPosts;
    fireEvent.click(within(list).getByRole("button", { name: "Try again" }));
    expect(
      await within(list).findByRole("link", { name: /Single sign-on/ }),
    ).toBeVisible();
    expect(view.queryAllByRole("alert")).toHaveLength(0);
  });

  it("loads more requests into the list pane", async () => {
    const api = prepare(
      reads({
        listQuillsPosts: (calls: number) =>
          calls === 0
            ? { ...inboxPosts, nextCursor: "post_sso", hasMore: true }
            : {
                ...inboxPosts,
                items: [
                  {
                    ...inboxPosts.items[1],
                    id: "post_dark",
                    title: "Dark mode",
                  },
                ],
              },
      }),
    );
    const view = render();
    await loaded(view);
    const list = listPane(view);
    fireEvent.click(
      await within(list).findByRole("button", { name: "Load more requests" }),
    );
    expect(
      await within(list).findByRole("link", { name: /Dark mode/ }),
    ).toBeVisible();
    expect(
      new URL(api.calls("listQuillsPosts")[1]!.url).searchParams.get("cursor"),
    ).toBe("post_sso");
    expect(
      within(list).queryByRole("button", { name: "Load more requests" }),
    ).toBeNull();
  });

  it("lists the open requests beside a request opened from the Deleted filter", async () => {
    const api = prepare();
    const view = renderPage(TeamPostPage, meta, {
      ...options,
      search: { status: "deleted" },
    });
    await loaded(view);
    await within(listPane(view)).findByRole("link", { name: /Single sign-on/ });
    const query = new URL(api.calls("listQuillsPosts")[0]!.url).searchParams;
    // A deleted request does not open, so the pane lists the open requests.
    expect(query.get("showDeleted")).toBeNull();
    expect(query.get("statusIds")).toBe("status_open,status_planned");
  });

  it("sends a private note from the composer", async () => {
    const api = prepare(
      reads({
        createQuillsComment: createCommentFixture.ok({ isPrivate: true }),
      }),
    );
    const view = render();
    await loaded(view);
    press("Mode: Public");
    fireEvent.click(
      await view.findByRole("menuitemradio", { name: "Private note" }),
    );
    comment(view, "Call them on Monday.");
    await waitFor(() =>
      expect(api.calls("createQuillsComment")).toHaveLength(1),
    );
    await expect(
      api.calls("createQuillsComment")[0]!.clone().json(),
    ).resolves.toEqual({ content: "Call them on Monday.", isPrivate: true });
  });

  it("accepts a pending request into the next status", async () => {
    const api = prepare(
      reads({
        setQuillsPostStatus: setPostStatusFixture.ok({ id: "post_export" }),
        getQuillsPost: (calls: number) =>
          calls === 0
            ? postDetail
            : { ...postDetail, statusId: "status_planned" },
      }),
    );
    const view = render();
    await loaded(view);
    // The test workspace has no closed status.
    expect(view.getByRole("button", { name: "Close" })).toBeDisabled();
    press(/^Accept/);
    await waitFor(() =>
      expect(api.calls("setQuillsPostStatus")).toHaveLength(1),
    );
    await expect(
      api.calls("setQuillsPostStatus")[0]!.clone().json(),
    ).resolves.toEqual({ statusId: "status_planned" });
    expect(
      await view.findByRole("button", { name: "Status: Planned" }),
    ).toBeVisible();
    expect(
      view.getByRole("button", { name: /^Move to Complete/ }),
    ).toBeVisible();
  });

  it("merges this request into another one from the palette", async () => {
    const api = prepare(reads({ mergeQuillsPost: mergePostFixture.ok() }));
    const view = render();
    await loaded(view);
    press("Merge");
    fireEvent.change(
      await view.findByRole("combobox", {
        name: "Find the request to merge this into…",
      }),
      { target: { value: "sign" } },
    );
    const palette = await view.findByRole("dialog", { name: "Merge into" });
    const option = await within(palette).findByRole("option", {
      name: /Single sign-on/,
    });
    // The search leaves out this request.
    expect(
      within(palette).queryByRole("option", { name: /Export to CSV/ }),
    ).toBeNull();
    fireEvent.click(option);
    await waitFor(() => expect(api.calls("mergeQuillsPost")).toHaveLength(1));
    expect(new URL(api.calls("mergeQuillsPost")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/merge",
    );
    await expect(
      api.calls("mergeQuillsPost")[0]!.clone().json(),
    ).resolves.toEqual({ canonicalPostId: "post_sso" });
  });

  it("deletes the request after a confirmation and goes back to the list", async () => {
    const api = prepare(reads({ deleteQuillsPost: deletePostFixture.ok() }));
    const view = render();
    await loaded(view);
    press("More actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete" }));
    const dialog = await view.findByRole("dialog", {
      name: "Delete this request?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(view.router.state.location.pathname).toBe(
        "/feedback/workspace_test_1/posts",
      ),
    );
    expect(api.calls("deleteQuillsPost")).toHaveLength(1);
    expect(view.router.state.location.search).toEqual({ board: "board_ideas" });
  });

  it("moves to the next request and back to the list with the filters", async () => {
    prepare();
    const view = render();
    await loaded(view);
    await within(listPane(view)).findByRole("link", { name: /Single sign-on/ });
    fireEvent.click(view.getAllByRole("button", { name: "Next" })[0]!);
    await waitFor(() =>
      expect(view.router.state.location.pathname).toBe(
        "/feedback/workspace_test_1/posts/post_sso",
      ),
    );
    press(/^Back to /);
    await waitFor(() =>
      expect(view.router.state.location.pathname).toBe(
        "/feedback/workspace_test_1/posts",
      ),
    );
    expect(view.router.state.location.search).toEqual({ board: "board_ideas" });
  });
});
