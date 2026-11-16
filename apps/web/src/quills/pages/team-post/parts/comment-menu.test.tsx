import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { deleteCommentFixture } from "../../../api/team/delete-comment.fixture";
import { restoreCommentFixture } from "../../../api/team/restore-comment.fixture";
import { removeCommentPinFixture } from "../../../api/team/remove-comment-pin.fixture";
import { setCommentPinFixture } from "../../../api/team/set-comment-pin.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { postComments, postDetail, postTeam } from "../post.fixture";
import { CommentMenu } from "./comment-menu";

const [customer, reply] = postComments.items;
const render = (
  comment = reply,
  post = postDetail,
  team = postTeam,
  onEdit = vi.fn(),
) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <CommentMenu
        workspaceId="workspace_test_1"
        post={post}
        comment={comment}
        onEdit={onEdit}
      />
    </TeamRuntimeProvider>,
  );

type Undo = { action?: { label: string; onClick: () => void } } | undefined;

describe("CommentMenu", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the delete toast with Undo after the menu unmounts, and restores", async () => {
    const api = mockApi();
    let finish: (() => void) | undefined;
    api.defer(({ resolve }) => {
      finish = () => resolve(deleteCommentFixture.ok());
    });
    const success = vi.spyOn(toast, "success");
    const view = render(customer);
    press("Comment actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete" }));
    await waitFor(() => expect(finish).toBeDefined());
    // The thread drops the menu of a deleted comment before the delete settles.
    view.unmount();
    finish!();
    await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
    const [title, options] = success.mock.calls[0]! as [string, Undo];
    expect(title).toBe("Comment deleted");
    api.reply(restoreCommentFixture.ok());
    options!.action!.onClick();
    await waitFor(() =>
      expect(api.calls("restoreQuillsComment")).toHaveLength(1),
    );
  });

  it("offers no Undo for the pinned comment, which a restore does not pin again", async () => {
    const api = mockApi();
    api.reply(deleteCommentFixture.ok());
    const success = vi.spyOn(toast, "success");
    const view = render(reply, { ...postDetail, pinnedCommentId: reply.id });
    press("Comment actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete" }));
    await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
    expect(success.mock.calls[0]![1]).toBeUndefined();
  });

  it("pins a public teammate comment and starts an edit", async () => {
    const api = mockApi();
    api.reply(setCommentPinFixture.ok());
    const onEdit = vi.fn();
    const view = render(reply, postDetail, postTeam, onEdit);
    press("Comment actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Pin" }));
    await waitFor(() =>
      expect(api.calls("setQuillsCommentPin")).toHaveLength(1),
    );
    expect(new URL(api.calls("setQuillsCommentPin")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/pinned-comment/comment_reply",
    );
    press("Comment actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalled();
  });

  it("unpins the pinned comment", async () => {
    const api = mockApi();
    api.reply(removeCommentPinFixture.ok());
    const view = render(reply, { ...postDetail, pinnedCommentId: reply.id });
    press("Comment actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Unpin" }));
    await waitFor(() =>
      expect(api.calls("removeQuillsCommentPin")).toHaveLength(1),
    );
  });

  it("does not offer Pin for a customer comment, and deletes it", async () => {
    const api = mockApi();
    api.reply(deleteCommentFixture.ok());
    const view = render(customer);
    press("Comment actions");
    await view.findByRole("menuitem", { name: "Edit" });
    expect(view.queryByRole("menuitem", { name: "Pin" })).toBeNull();
    fireEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    await waitFor(() =>
      expect(api.calls("deleteQuillsComment")).toHaveLength(1),
    );
    expect(new URL(api.calls("deleteQuillsComment")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/comments/comment_customer",
    );
  });

  it("deletes another person's comment only with the delete permission", async () => {
    mockApi();
    const editor = {
      ...postTeam,
      permissions: { ...postTeam.permissions, delete: false },
    };
    const view = render(customer, postDetail, editor);
    press("Comment actions");
    await view.findByRole("menuitem", { name: "Edit" });
    expect(view.queryByRole("menuitem", { name: "Delete" })).toBeNull();
  });

  it("deletes the teammate's own comment without the delete permission, with no Undo", async () => {
    const api = mockApi();
    api.reply(deleteCommentFixture.ok());
    const success = vi.spyOn(toast, "success");
    const editor = {
      ...postTeam,
      permissions: { ...postTeam.permissions, delete: false },
    };
    // The reply is by principal_team, the viewer of postDetail.
    const view = render(reply, postDetail, editor);
    press("Comment actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete" }));
    await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
    // A restore needs the delete permission.
    expect(success.mock.calls[0]![1]).toBeUndefined();
    expect(new URL(api.calls("deleteQuillsComment")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/comments/comment_reply",
    );
  });

  it("is left out without the update or delete permission", () => {
    mockApi();
    const reader = {
      ...postTeam,
      permissions: { ...postTeam.permissions, update: false, delete: false },
    };
    const view = render(reply, postDetail, reader);
    expect(view.queryByRole("button", { name: "Comment actions" })).toBeNull();
  });
});
